import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { getAdminClient } from '../../../lib/supabase';
import { getSession } from '../../../lib/photo-hub';

export const prerender = false;

const MAX_LONG_EDGE = 2200;   // downscale huge camera JPGs to this on the long edge
const THUMB_EDGE    = 480;    // thumbnail long edge (for review UI + gallery grid)
const MAX_BATCH     = 200;    // hard cap per submission — a full round is ~50-80 photos

function safeFilename(orig: string): string {
  return orig.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

async function processImage(buf: Buffer, contentType: string): Promise<{
  full: Buffer; thumb: Buffer; width: number; height: number; contentType: string;
}> {
  // Auto-rotate off EXIF orientation, strip metadata (incl. GPS), resize.
  const rotated = sharp(buf, { failOn: 'none' }).rotate();
  const meta    = await rotated.metadata();
  const targetType = 'image/jpeg';
  const full = await rotated
    .resize({ width: MAX_LONG_EDGE, height: MAX_LONG_EDGE, fit: 'inside', withoutEnlargement: true })
    .withMetadata({ orientation: undefined })  // rotated pixels; drop orientation flag
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  const thumb = await sharp(buf, { failOn: 'none' }).rotate()
    .resize({ width: THUMB_EDGE, height: THUMB_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 75, mozjpeg: true })
    .toBuffer();
  return {
    full:   full.data,
    thumb,
    width:  full.info.width,
    height: full.info.height,
    contentType: targetType,
  };
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ ok: false, error: 'Not signed in.' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const form = await request.formData();
  const fixtureId  = String(form.get('fixture_id')  ?? '').trim() || null;
  const roundStr   = String(form.get('round')       ?? '').trim();
  const opponent   = String(form.get('opponent')    ?? '').trim() || null;
  const venue      = String(form.get('venue')       ?? '').trim() || null;
  const matchDate  = String(form.get('match_date')  ?? '').trim() || null;
  const grade      = String(form.get('grade')       ?? '').trim() || null;
  const note       = String(form.get('note')        ?? '').trim() || null;
  const consentAck = form.get('consent_ack') === 'true' || form.get('consent_ack') === 'on';

  if (!consentAck) {
    return new Response(JSON.stringify({ ok: false, error: 'You must tick the consent statement to upload.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: 'No files were attached.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (files.length > MAX_BATCH) {
    return new Response(JSON.stringify({ ok: false, error: `Please submit no more than ${MAX_BATCH} photos at once.` }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const admin = getAdminClient();

  // Record consent moment on the contributor
  await admin.from('photo_contributors')
    .update({ consent_declared_at: new Date().toISOString() })
    .eq('id', session.contributorId);

  // Create batch
  const { data: batchRow, error: batchErr } = await admin.from('photo_submission_batches').insert({
    contributor_id: session.contributorId,
    fixture_id:     fixtureId,
    round:          roundStr ? parseInt(roundStr, 10) : null,
    season:         2026,
    grade,
    opponent,
    venue,
    match_date:     matchDate,
    note,
    consent_ack:    true,
    photo_count:    0,
  }).select('id').single();
  if (batchErr || !batchRow) {
    return new Response(JSON.stringify({ ok: false, error: 'Could not start the upload batch.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const results: { name: string; ok: boolean; error?: string }[] = [];
  let uploaded = 0;

  for (const file of files) {
    try {
      const bytes = Buffer.from(await file.arrayBuffer());
      const processed = await processImage(bytes, file.type || 'image/jpeg');
      const stem = safeFilename(file.name.replace(/\.[a-z0-9]+$/i, '')) || 'photo';
      const uniq = crypto.randomUUID().slice(0, 8);
      const fullPath  = `${session.contributorId}/${batchRow.id}/${stem}-${uniq}.jpg`;
      const thumbPath = `${session.contributorId}/${batchRow.id}/${stem}-${uniq}.thumb.jpg`;

      const up1 = await admin.storage.from('photo-submissions')
        .upload(fullPath,  processed.full,  { contentType: 'image/jpeg', upsert: false });
      const up2 = await admin.storage.from('photo-submissions')
        .upload(thumbPath, processed.thumb, { contentType: 'image/jpeg', upsert: false });
      if (up1.error || up2.error) throw new Error(up1.error?.message ?? up2.error?.message ?? 'Storage upload failed');

      const { error: insErr } = await admin.from('photo_submissions').insert({
        batch_id:       batchRow.id,
        contributor_id: session.contributorId,
        storage_path:   fullPath,
        thumb_path:     thumbPath,
        original_name:  file.name,
        content_type:   'image/jpeg',
        width:          processed.width,
        height:         processed.height,
        size_bytes:     processed.full.length,
      });
      if (insErr) throw new Error(insErr.message);

      uploaded++;
      results.push({ name: file.name, ok: true });
    } catch (e: any) {
      results.push({ name: file.name, ok: false, error: e?.message ?? String(e) });
    }
  }

  await admin.from('photo_submission_batches').update({ photo_count: uploaded }).eq('id', batchRow.id);

  return new Response(JSON.stringify({
    ok:       true,
    batch_id: batchRow.id,
    uploaded,
    failed:   results.filter(r => !r.ok).length,
    results,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
