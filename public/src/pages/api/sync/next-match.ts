/**
 * GET|POST /api/sync/next-match
 *
 * Reads the next upcoming Wallaroo fixture from the Supabase `fixtures` table
 * and updates all `next_match_*` and `current_round` keys in `site_config`.
 * Also updates `our_record` from the A-Grade ladder.
 *
 * Called by:
 *   - Vercel cron — every Sunday 06:00 ACST (Saturday 20:30 UTC)
 *   - Admin "Sync Next Match" button  →  POST with Authorization: Bearer <CRON_SECRET>
 *   - Manual: GET /api/sync/next-match?secret=<CRON_SECRET>
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../lib/supabase';

const SEASON = parseInt(import.meta.env.PLAYHQ_SEASON_YEAR ?? '2026');

// YPFL 2026 season round dates (Saturdays, ACST).
// Update if the YPFL schedule changes mid-season.
const ROUND_DATES: Record<number, string> = {
  1:  'Sat 4 Apr',
  2:  'Sat 11 Apr',
  3:  'Sat 18 Apr',
  4:  'Sat 25 Apr',
  5:  'Sat 2 May',
  6:  'Sat 16 May',
  7:  'Sat 23 May',
  8:  'Sat 6 Jun',
  9:  'Sat 13 Jun',
  10: 'Sat 20 Jun',
  11: 'Sat 27 Jun',
  12: 'Sat 4 Jul',
  13: 'Sat 18 Jul',
  14: 'Sat 25 Jul',
  15: 'Sat 1 Aug',
  16: 'Sat 8 Aug',
  17: 'Sat 15 Aug',
  18: 'Sat 22 Aug',
};

// Standard A-Grade bounce time; used when no match_time is stored
const A_GRADE_BOUNCE = '2:40 PM';

// Venue name map for away games (slug → venue label)
const AWAY_VENUES: Record<string, string> = {
  moonta:           'Moonta Oval',
  kadina:           'Kadina Oval',
  ardrossan:        'Ardrossan Oval',
  bute:             'Bute Oval',
  'central-yorke':  'Central Yorke Oval',
  cms:              'CMS Oval',
  paskeville:       'Paskeville Oval',
  'southern-eagles': 'Stansbury Oval',
};

function teamSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
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

async function syncNextMatch() {
  const db = getAdminClient();
  const log: string[] = [];

  // ── 1. Find next upcoming Wallaroo A-Grade fixture ────────────────────────
  const { data: fixtures, error: fErr } = await db
    .from('fixtures')
    .select('round,grade,opponent,is_home,home_team,away_team,venue')
    .eq('season', SEASON)
    .eq('grade', 'A-Grade')
    .eq('status', 'upcoming')
    .not('opponent', 'is', null)
    .order('round')
    .limit(1)
    .single();

  if (fErr || !fixtures) {
    throw new Error(`No upcoming Wallaroo fixture found: ${fErr?.message}`);
  }

  const nextRound    = fixtures.round as number;
  const opponent     = fixtures.opponent as string;
  const isHome       = fixtures.is_home as boolean;
  const slug         = teamSlug(opponent);
  const roundDate    = ROUND_DATES[nextRound] ?? '';
  const venue        = isHome ? 'Wallaroo Oval' : (AWAY_VENUES[slug] ?? `${opponent} Oval`);
  const homeOrAway   = isHome ? 'HOME' : 'AWAY';
  const venueLabel   = isHome ? 'HOME ROUND' : 'AWAY ROUND';

  log.push(`Next match: R${nextRound} ${homeOrAway} vs ${opponent} on ${roundDate}`);

  // ── 2. Get opponent's current A-Grade ladder position + record ────────────
  const { data: ladderRow } = await db
    .from('ladders')
    .select('rows')
    .eq('season', SEASON)
    .eq('grade', 'A-Grade')
    .single();

  let opponentRecord = '';
  let ourRecord      = '';
  let ourPos         = 0;

  if (ladderRow?.rows) {
    const rows = ladderRow.rows as Array<{ slug: string; pos: number; w: number; l: number; highlight?: boolean }>;
    const oppRow = rows.find(r => r.slug === slug);
    const wallarooRow = rows.find(r => r.highlight);
    if (oppRow) opponentRecord = `${oppRow.w}W · ${oppRow.l}L · ${oppRow.pos}${ordinal(oppRow.pos)}`;
    if (wallarooRow) {
      ourPos = wallarooRow.pos;
      ourRecord = `${wallarooRow.w}W · ${wallarooRow.l}L · ${wallarooRow.pos}${ordinal(wallarooRow.pos)}`;
    }
  }

  // ── 3. Compute last completed round from results ───────────────────────────
  const { data: latestResult } = await db
    .from('results')
    .select('round')
    .eq('season', SEASON)
    .is('bye_team', null)
    .order('round', { ascending: false })
    .limit(1)
    .single();

  const lastCompletedRound = latestResult?.round ?? (nextRound - 1);

  // ── 4. Update site_config ─────────────────────────────────────────────────
  const configUpdates = [
    { key: 'current_round',              value: String(nextRound) },
    { key: 'current_date',               value: roundDate },
    { key: 'next_match_date',            value: roundDate },
    { key: 'next_match_bounce',          value: A_GRADE_BOUNCE },
    { key: 'next_match_venue',           value: venue },
    { key: 'next_match_home_or_away',    value: homeOrAway },
    { key: 'next_match_opponent',        value: slug },
    { key: 'next_match_opponent_name',   value: opponent },
    { key: 'next_match_opponent_record', value: opponentRecord },
    { key: 'our_record',                 value: ourRecord },
    { key: 'this_week_venue',            value: venue },
    { key: 'this_week_venue_label',      value: venueLabel },
    { key: 'last_completed_round',       value: String(lastCompletedRound) },
    { key: 'next_match_last_sync',       value: new Date().toISOString() },
  ];

  const errors: string[] = [];
  for (const row of configUpdates) {
    const { error } = await db.from('site_config').upsert(row, { onConflict: 'key' });
    if (error) errors.push(`${row.key}: ${error.message}`);
  }

  log.push(`Updated ${configUpdates.length - errors.length}/${configUpdates.length} site_config keys`);
  return { nextRound, opponent, homeOrAway, roundDate, ourRecord, opponentRecord, lastCompletedRound, log, errors };
}

function ordinal(n: number): string {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
}

export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  try {
    const result = await syncNextMatch();
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
    const result = await syncNextMatch();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status:  result.errors.length ? 207 : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
};
