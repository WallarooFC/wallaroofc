import type { APIRoute } from 'astro';
import { getAdminClient, supabase } from '../../../lib/supabase';

export const prerender = false;

async function getRole(request: Request) {
  const cookie = request.headers.get('cookie') ?? '';
  const token  = cookie.match(/sb-access-token=([^;]+)/)?.[1];
  if (!token) return null;
  const { data } = await supabase.auth.getUser(token);
  if (!data?.user) return null;
  const { data: profile } = await getAdminClient()
    .from('profiles').select('role').eq('id', data.user.id).single();
  return { userId: data.user.id, role: profile?.role ?? null };
}

const WRITE_ROLES = ['admin', 'secretary', 'president', 'treasurer', 'committee'];

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/**
 * Move a submission from photo-submissions → public gallery bucket, then
 * insert a corresponding row into `gallery` so the public site picks it up.
 */
async function approveSubmission(admin: ReturnType<typeof getAdminClient>, subId: string, reviewer: string) {
  const { data: sub, error } = await admin.from('photo_submissions')
    .select('id, storage_path, thumb_path, original_name, caption, batch_id, contributor_id, batch:photo_submission_batches ( round, season, opponent, match_date, grade )')
    .eq('id', subId).single();
  if (error || !sub) throw new Error(`Submission ${subId} not found`);
  const batch: any = (sub as any).batch;
  const season = Number(batch?.season) || new Date().getFullYear();

  // Download from private bucket
  const { data: dl, error: dlErr } = await admin.storage.from('photo-submissions').download(sub.storage_path);
  if (dlErr || !dl) throw new Error(`Download failed: ${dlErr?.message}`);
  const bytes = new Uint8Array(await dl.arrayBuffer());

  // Upload to public gallery bucket
  const galleryPath = `approved/${season}/round-${batch?.round ?? 'x'}/${sub.id}.jpg`;
  const up = await admin.storage.from('gallery').upload(galleryPath, bytes, {
    contentType: 'image/jpeg', upsert: true,
  });
  if (up.error) throw new Error(`Upload failed: ${up.error.message}`);

  // Build the public URL from the gallery bucket's CDN endpoint.
  const { data: pub } = admin.storage.from('gallery').getPublicUrl(galleryPath);
  const publicUrl = pub?.publicUrl ?? '';

  // Insert gallery row. Every text column in `gallery` is NOT NULL so we
  // always supply at least an empty string.
  const caption = (sub.caption ?? '').toString().trim()
    || [batch?.grade, batch?.opponent ? `v ${batch.opponent}` : '', batch?.round ? `Rd ${batch.round}` : '']
       .filter(Boolean).join(' · ')
    || 'Match photo';
  const alt = sub.original_name?.trim() || caption || 'Wallaroo FC match photo';

  const { data: galleryRow, error: gErr } = await admin.from('gallery').insert({
    season,
    round:         batch?.round ?? null,
    grade:         batch?.grade ?? null,
    url:           publicUrl,
    storage_path:  galleryPath,
    alt,
    caption,
    display_order: 0,
    published:     true,
  }).select('id').single();
  if (gErr) throw new Error(`Gallery insert failed: ${gErr.message}`);

  // Mark submission approved + link
  await admin.from('photo_submissions').update({
    status: 'approved', gallery_id: galleryRow!.id,
    reviewed_by: reviewer, reviewed_at: new Date().toISOString(),
  }).eq('id', subId);

  // Clean up staging file(s)
  const staging = [sub.storage_path, sub.thumb_path].filter(Boolean) as string[];
  if (staging.length) await admin.storage.from('photo-submissions').remove(staging);
}

async function rejectSubmission(admin: ReturnType<typeof getAdminClient>, subId: string, reviewer: string, reason?: string) {
  const { data: sub, error } = await admin.from('photo_submissions')
    .select('storage_path, thumb_path').eq('id', subId).single();
  if (error || !sub) throw new Error(`Submission ${subId} not found`);
  const staging = [sub.storage_path, sub.thumb_path].filter(Boolean) as string[];
  if (staging.length) await admin.storage.from('photo-submissions').remove(staging);
  await admin.from('photo_submissions').update({
    status: 'rejected', reject_reason: reason ?? null,
    reviewed_by: reviewer, reviewed_at: new Date().toISOString(),
  }).eq('id', subId);
}

export const POST: APIRoute = async ({ request }) => {
  const auth = await getRole(request);
  if (!auth?.role || !WRITE_ROLES.includes(auth.role)) return json({ ok: false, error: 'Unauthorized' }, 401);

  const body = await request.json().catch(() => null) as { action?: 'approve' | 'reject'; ids?: string[]; reason?: string } | null;
  if (!body?.action || !Array.isArray(body.ids) || body.ids.length === 0) {
    return json({ ok: false, error: 'action and ids required' }, 400);
  }

  const admin = getAdminClient();
  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const id of body.ids) {
    try {
      if (body.action === 'approve') await approveSubmission(admin, id, auth.userId);
      else                          await rejectSubmission(admin, id, auth.userId, body.reason);
      results.push({ id, ok: true });
    } catch (e: any) {
      results.push({ id, ok: false, error: e?.message ?? String(e) });
    }
  }

  return json({
    ok: true,
    processed: results.filter(r => r.ok).length,
    failed:    results.filter(r => !r.ok).length,
    results,
  });
};
