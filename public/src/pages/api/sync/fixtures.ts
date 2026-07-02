/**
 * GET /api/sync/fixtures
 *
 * Syncs fixture schedule from PlayHQ into Supabase.
 * Uses the public PlayHQ GraphQL API — no API key required.
 *
 * Called by:
 *   - Vercel cron — Sunday 04:00 ACST
 *   - Admin "Sync Fixtures" button  →  POST with Authorization: Bearer <CRON_SECRET>
 *   - Manual curl: GET ?secret=<CRON_SECRET>
 *
 * Note: The main /api/sync/playhq endpoint also syncs fixtures (plus results
 * and ladders). This endpoint is a lighter alternative when only fixtures need
 * refreshing (e.g. if a draw changes).
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../lib/supabase';
import { getAllGradesData } from '../../../lib/playhq';

const SEASON = parseInt(import.meta.env.PLAYHQ_SEASON_YEAR ?? '2026');
const WALLAROO_NAMES = ['wallaroo', 'wallaroo fc', 'wallaroo bulldogs'];

function isWallarooName(name?: string) {
  return WALLAROO_NAMES.includes((name ?? '').toLowerCase().trim());
}

function checkAuth(req: Request): boolean {
  const secret = import.meta.env.CRON_SECRET;
  if (req.headers.get('x-vercel-cron') === '1') return true;
  const auth = req.headers.get('authorization') ?? '';
  if (auth === `Bearer ${secret}` || auth === secret) return true;
  const url = new URL(req.url);
  if (url.searchParams.get('secret') === secret) return true;
  return false;
}

async function syncFixtures() {
  const db     = getAdminClient();
  const log: string[]    = [];
  const errors: string[] = [];
  let synced = 0;

  const { fixtures } = await getAllGradesData();
  log.push(`Fetched ${fixtures.length} fixtures from PlayHQ`);

  for (const f of fixtures) {
    if (f.status === 'bye' || !f.homeTeam || !f.awayTeam) continue;

    const wallarooIsHome = f.isWallarooHome;
    const wallarooIsAway = f.isWallarooAway;
    const wallarooInGame = wallarooIsHome || wallarooIsAway;
    const opponent       = wallarooIsHome ? f.awayTeam.name : f.homeTeam.name;

    const isHome = wallarooInGame
      ? wallarooIsHome
      : isWallarooName(f.homeTeam.name) ? true : isWallarooName(f.awayTeam.name) ? false : null;

    const row = {
      playhq_id: f.id,
      season:    SEASON,
      round:     f.roundNumber,
      grade:     f.grade,
      home_team: f.homeTeam.name,
      away_team: f.awayTeam.name,
      is_home:   isHome,
      opponent:  wallarooInGame ? opponent : null,
      status:    f.status === 'completed' ? 'completed' : 'upcoming',
      synced_at: new Date().toISOString(),
    };

    const { error } = await db.from('fixtures').upsert(row, { onConflict: 'playhq_id' });
    if (error) errors.push(`Fixture ${f.id}: ${error.message}`);
    else synced++;
  }

  await db.from('site_config').upsert({ key: 'fixtures_last_sync', value: new Date().toISOString() });

  log.push(`Fixtures synced: ${synced}`);
  return { synced, errors, log };
}

export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  try {
    const result = await syncFixtures();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status:  result.errors.length ? 207 : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  try {
    const result = await syncFixtures();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status:  result.errors.length ? 207 : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
};
