import type { APIRoute } from 'astro';
import { zipSync } from 'fflate';
import { getAdminClient } from '../../../lib/supabase';

export const prerender = false;

/**
 * Bundles all published photos for a given round (and season) into a single
 * .zip download. Reads from the Supabase `gallery` storage bucket server-side.
 *
 * GET /api/gallery/download?round=7&season=2026
 */
export const GET: APIRoute = async ({ url }) => {
  const round = Number.parseInt(url.searchParams.get('round') ?? '', 10);
  const season = Number.parseInt(url.searchParams.get('season') ?? '', 10) || 2026;

  if (!Number.isFinite(round)) {
    return new Response('Missing or invalid round.', { status: 400 });
  }

  const db = getAdminClient();

  const { data: photos, error } = await db
    .from('gallery')
    .select('storage_path, caption, display_order')
    .eq('published', true)
    .eq('round', round)
    .eq('season', season)
    .order('display_order', { ascending: true });

  if (error) return new Response('Could not load photos.', { status: 500 });
  if (!photos || photos.length === 0) {
    return new Response(`No photos for round ${round}.`, { status: 404 });
  }

  const files: Record<string, Uint8Array> = {};
  let idx = 0;

  for (const p of photos) {
    const path = (p as any).storage_path as string | null;
    if (!path) continue;
    const { data: blob, error: dlErr } = await db.storage.from('gallery').download(path);
    if (dlErr || !blob) continue;

    idx++;
    const ext = path.split('.').pop()?.toLowerCase() || 'jpg';
    const slug =
      ((p as any).caption as string | null)?.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 40) ||
      'photo';
    files[`${String(idx).padStart(2, '0')}-${slug}.${ext}`] = new Uint8Array(await blob.arrayBuffer());
  }

  if (Object.keys(files).length === 0) {
    return new Response('No downloadable photos for that round.', { status: 404 });
  }

  const zipped = zipSync(files, { level: 6 });

  return new Response(zipped, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="wallaroo-fc-round-${round}-${season}.zip"`,
      'Cache-Control': 'no-store',
    },
  });
};
