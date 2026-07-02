import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../lib/supabase';

export const prerender = false;

/**
 * Same-origin JSON the landing-page popup script fetches on every visit.
 * Returns `{ takeover: null }` when nothing is active, or the active
 * takeover's template body (heading/body/CTA and optional imageUrl).
 * Read-only, no PII — safe to serve unauthenticated.
 */
export const GET: APIRoute = async () => {
  try {
    const db = getAdminClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await db
      .from('landing_takeovers')
      .select('id, ends_at, template:templates(id, body)')
      .eq('is_paused', false)
      .lte('starts_at', nowIso)
      .gt('ends_at', nowIso)
      .order('starts_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return json({ takeover: null });

    const template = (data as any).template;
    return json({
      takeover: {
        id: data.id,
        endsAt: (data as any).ends_at,
        template: { id: template?.id, body: template?.body ?? null },
      },
    });
  } catch {
    return json({ takeover: null });
  }
};

function json(obj: unknown) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
