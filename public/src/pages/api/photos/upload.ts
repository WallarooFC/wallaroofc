import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { getAdminClient } from '../../../lib/supabase';
import { getSession } from '../../../lib/photo-hub';

export const prerender = false;

const MAX_LONG_EDGE = 2200;   // downscale huge camera JPGs to this on the long edge
const THUMB_EDGE    = 480;    // thumbnail long edge (for review UI + gallery grid)
const MAX_BATCH     = 200;    // hard cap per submission — a full round is ~50-80 photos

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}

function safeFilename(orig: string): string {
  return orig.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

async function processImage(buf: Buffer): Promise<{
  full: Buffer; thumb: Buffer; width: number; height: number;
}> {
  // Auto-rotate off EXIF orientation, strip metadata (incl. GPS), resize.
  const rotated = sharp(buf, { failOn: 'none' }).rotate();
  const full = await rotated
    .resize({ width: MAX_LONG_EDGE, height: MAX_LONG_EDGE, fit: 'inside', withoutEnlargement: true })
    .withMetadata({ orientation: undefined })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  const thumb = await sharp(buf, { failOn: 'none' }).rotate()
    .resize({ width: THUMB_EDGE, height: THUMB_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 75, mozjpeg: true })
    .toBuffer();
  return { full: full.data, thumb, width: full.info.width, height: full.info.height };
}

// Store one processed photo for a batch and insert its submission row.
async function storeOne(
  admin: ReturnType<typeof getAdminClient>,
  contributorId: string,
  batchId: string,
  file: File,
  originalName: string,
) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const processed = await processImage(bytes);
  const stem = safeFilename(originalName.replace(/\.[a-z0-9]+$/i, '')) || 'photo';
  const uniq = crypto.randomUUID().slice(0, 8);
  const fullPath  = `${contributorId}/${batchId}/${stem}-${uniq}.jpg`;
  const thumbPath = `${contributorId}/${batchId}/${stem}-${uniq}.thumb.jpg`;

  const up1 = await admin.storage.from('photo-submissions')
    .upload(fullPath, processed.full, { contentType: 'image/jpeg', upsert: false });
  const up2 = await admin.storage.from('photo-submissions')
    .upload(thumbPath, processed.thumb, { contentType: 'image/jpeg', upsert: false });
  if (up1.error || up2.error) {
    throw new Error(up1.error?.message ?? up2.error?.message ?? 'Storage upload failed');
  }

  const { error: insErr } = await admin.from('photo_submissions').insert({
    batch_id:       batchId,
    contributor_id: contributorId,
    storage_path:   fullPath,
    thumb_path:     thumbPath,
    original_name:  originalName,
    content_type:   'image/jpeg',
    width:          processed.width,
    height:         processed.height,
    size_bytes:     processed.full.length,
  });
  if (insErr) throw new Error(insErr.message);
}

async function loadOwnedBatch(admin: ReturnType<typeof getAdminClient>, batchId: string, contributorId: string) {
  if (!batchId) return null;
  const { data } = await admin.from('photo_submission_batches')
    .select('id, contributor_id').eq('id', batchId).single();
  if (!data || data.contributor_id !== contributorId) return null;
  return data;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) return json({ ok: false, error: 'Not signed in.' }, 401);

  const form  = await request.formData();
  const phase = String(form.get('phase') ?? '').trim();
  const admin = getAdminClient();

  // ── phase: start — create the batch, return its id ────────────────────────
  if (phase === 'start') {
    const consentAck = form.get('consent_ack') === 'true' || form.get('consent_ack') === 'on';
    if (!consentAck) return json({ ok: false, error: 'You must tick the consent statement to upload.' }, 400);

    const roundStr = String(form.get('round') ?? '').trim();
    await admin.from('photo_contributors')
      .update({ consent_declared_at: new Date().toISOString() })
      .eq('id', session.contributorId);

    const { data: batchRow, error } = await admin.from('photo_submission_batches').insert({
      contributor_id: session.contributorId,
      fixture_id:     String(form.get('fixture_id') ?? '').trim() || null,
      round:          roundStr ? parseInt(roundStr, 10) : null,
      season:         2026,
      grade:          String(form.get('grade') ?? '').trim() || null,
      opponent:       String(form.get('opponent') ?? '').trim() || null,
      venue:          String(form.get('venue') ?? '').trim() || null,
      match_date:     String(form.get('match_date') ?? '').trim() || null,
      note:           String(form.get('note') ?? '').trim() || null,
      consent_ack:    true,
      photo_count:    0,
    }).select('id').single();
    if (error || !batchRow) return json({ ok: false, error: 'Could not start the upload batch.' }, 500);
    return json({ ok: true, batch_id: batchRow.id });
  }

  // ── phase: file — process + store one already-resized photo ───────────────
  if (phase === 'file') {
    const batch = await loadOwnedBatch(admin, String(form.get('batch_id') ?? '').trim(), session.contributorId);
    if (!batch) return json({ ok: false, error: 'Upload session not found — please start again.' }, 403);
    const file = form.get('file');
    if (!(file instanceof File)) return json({ ok: false, error: 'No file received.' }, 400);
    try {
      await storeOne(admin, session.contributorId, batch.id, file, String(form.get('original_name') ?? file.name));
      return json({ ok: true, uploaded: 1 });
    } catch (e: any) {
      // 200 so the client keeps going with the rest of the batch
      return json({ ok: false, error: e?.message ?? String(e) }, 200);
    }
  }

  // ── phase: finish — set the batch photo_count from what actually landed ────
  if (phase === 'finish') {
    const batch = await loadOwnedBatch(admin, String(form.get('batch_id') ?? '').trim(), session.contributorId);
    if (!batch) return json({ ok: false, error: 'Upload session not found.' }, 403);
    const { count } = await admin.from('photo_submissions')
      .select('id', { count: 'exact', head: true }).eq('batch_id', batch.id);
    await admin.from('photo_submission_batches').update({ photo_count: count ?? 0 }).eq('id', batch.id);
    return json({ ok: true, uploaded: count ?? 0 });
  }

  // ── legacy: whole batch in one POST (kept so an old, cached page still works)
  const consentAck = form.get('consent_ack') === 'true' || form.get('consent_ack') === 'on';
  if (!consentAck) return json({ ok: false, error: 'You must tick the consent statement to upload.' }, 400);
  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) return json({ ok: false, error: 'No files were attached.' }, 400);
  if (files.length > MAX_BATCH) return json({ ok: false, error: `Please submit no more than ${MAX_BATCH} photos at once.` }, 400);

  await admin.from('photo_contributors')
    .update({ consent_declared_at: new Date().toISOString() })
    .eq('id', session.contributorId);

  const roundStr = String(form.get('round') ?? '').trim();
  const { data: batchRow, error: batchErr } = await admin.from('photo_submission_batches').insert({
    contributor_id: session.contributorId,
    fixture_id:     String(form.get('fixture_id') ?? '').trim() || null,
    round:          roundStr ? parseInt(roundStr, 10) : null,
    season:         2026,
    grade:          String(form.get('grade') ?? '').trim() || null,
    opponent:       String(form.get('opponent') ?? '').trim() || null,
    venue:          String(form.get('venue') ?? '').trim() || null,
    match_date:     String(form.get('match_date') ?? '').trim() || null,
    note:           String(form.get('note') ?? '').trim() || null,
    consent_ack:    true,
    photo_count:    0,
  }).select('id').single();
  if (batchErr || !batchRow) return json({ ok: false, error: 'Could not start the upload batch.' }, 500);

  const results: { name: string; ok: boolean; error?: string }[] = [];
  let uploaded = 0;
  for (const file of files) {
    try {
      await storeOne(admin, session.contributorId, batchRow.id, file, file.name);
      uploaded++; results.push({ name: file.name, ok: true });
    } catch (e: any) {
      results.push({ name: file.name, ok: false, error: e?.message ?? String(e) });
    }
  }
  await admin.from('photo_submission_batches').update({ photo_count: uploaded }).eq('id', batchRow.id);
  return json({ ok: true, batch_id: batchRow.id, uploaded, failed: results.filter(r => !r.ok).length, results });
};
