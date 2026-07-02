/**
 * POST /api/sync/playhq
 *
 * Syncs fixtures, results and ladders from PlayHQ into Supabase.
 * Uses the public PlayHQ GraphQL API — no API key required.
 *
 * Called by:
 *   - Vercel cron (vercel.json)
 *   - Admin dashboard "Sync Now" button
 *   - Manually: curl -X POST https://wallaroofc.com.au/api/sync/playhq \
 *       -H "Authorization: Bearer <CRON_SECRET>"
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../lib/supabase';
import { getAllGradesData, WALLAROO_ORG_ID } from '../../../lib/playhq';

const SEASON = parseInt(import.meta.env.PLAYHQ_SEASON_YEAR ?? '2026');
const WALLAROO_NAMES = ['wallaroo', 'wallaroo fc', 'wallaroo bulldogs'];

function isWallarooName(name?: string) {
  return WALLAROO_NAMES.includes((name ?? '').toLowerCase().trim());
}

/** Map a PlayHQ team name to a club slug for crests */
const SLUG_MAP: Record<string, string> = {
  'wallaroo':          'wallaroo',
  'wallaroo fc':       'wallaroo',
  'wallaroo bulldogs': 'wallaroo',
  'ardrossan':         'ardrossan',
  'bute':              'bute',
  'central yorke':     'central-yorke',
  'cms':               'cms',
  'cms crows':         'cms',
  'kadina':            'kadina',
  'moonta':            'moonta',
  'paskeville':        'paskeville',
  'southern eagles':   'southern-eagles',
  'southern':          'southern-eagles',
};

function teamSlug(name: string): string {
  return SLUG_MAP[name.toLowerCase().trim()] ?? name.toLowerCase().replace(/\s+/g, '-');
}

/** Display order for grades on the ladders page */
const GRADE_ORDER: Record<string, number> = {
  'A-Grade':      1,
  'B Grade':      2,
  'Senior Colts': 3,
  'Junior Colts': 4,
};

function checkAuth(req: Request): boolean {
  const secret = import.meta.env.CRON_SECRET;
  if (req.headers.get('x-vercel-cron') === '1') return true;
  const auth = req.headers.get('authorization') ?? '';
  if (auth === `Bearer ${secret}` || auth === secret) return true;
  const url = new URL(req.url);
  if (url.searchParams.get('secret') === secret) return true;
  return false;
}

async function runSync() {
  const db = getAdminClient();
  const log: string[] = [];
  const errors: string[] = [];

  log.push('Fetching all grades from PlayHQ public GraphQL…');
  const { fixtures, ladders } = await getAllGradesData();
  log.push(`Fetched ${fixtures.length} games/byes across ${ladders.length} ladder rows`);

  // ── 1. Sync fixtures & results ──────────────────────────────────────────
  let fixturesSynced = 0;
  let resultsSynced  = 0;

  for (const f of fixtures) {
    if (f.status === 'bye') {
      // Bye result row
      if (!f.byeTeam) continue;
      const byeRow = {
        playhq_id:  `bye-${f.id}`,
        season:     SEASON,
        round:      f.roundNumber,
        grade:      f.grade,
        home_team:  f.byeTeam.name,
        home_score: 0,
        away_team:  'BYE',
        away_score: 0,
        bye_team:   f.byeTeam.name,
        synced_at:  new Date().toISOString(),
      };
      const { error } = await db.from('results').upsert(byeRow, { onConflict: 'playhq_id' });
      if (error) errors.push(`Bye ${f.id}: ${error.message}`);
      else resultsSynced++;
      continue;
    }

    if (!f.homeTeam || !f.awayTeam) continue;

    // Fixture row (all games including future)
    const wallarooIsHome  = f.isWallarooHome;
    const wallarooIsAway  = f.isWallarooAway;
    const wallarooInGame  = wallarooIsHome || wallarooIsAway;
    const opponent        = wallarooIsHome ? f.awayTeam.name : f.homeTeam.name;

    // Determine is_home: Wallaroo games only; others get null
    const isHome = wallarooInGame
      ? wallarooIsHome
      : isWallarooName(f.homeTeam.name) ? true : isWallarooName(f.awayTeam.name) ? false : null;

    const fixtureRow = {
      playhq_id:  f.id,
      season:     SEASON,
      round:      f.roundNumber,
      grade:      f.grade,
      home_team:  f.homeTeam.name,
      away_team:  f.awayTeam.name,
      is_home:    isHome,
      opponent:   wallarooInGame ? opponent : null,
      status:     f.status === 'completed' ? 'completed' : 'upcoming',
      synced_at:  new Date().toISOString(),
    };

    const { error: fErr } = await db.from('fixtures').upsert(fixtureRow, { onConflict: 'playhq_id' });
    if (fErr) errors.push(`Fixture ${f.id}: ${fErr.message}`);
    else fixturesSynced++;

    // Result row (completed games only)
    if (f.status === 'completed' && f.homeScore !== undefined && f.awayScore !== undefined) {
      const resultRow = {
        playhq_id:  `result-${f.id}`,
        season:     SEASON,
        round:      f.roundNumber,
        grade:      f.grade,
        home_team:  f.homeTeam.name,
        home_score: f.homeScore,
        away_team:  f.awayTeam.name,
        away_score: f.awayScore,
        bye_team:   null,
        synced_at:  new Date().toISOString(),
      };
      const { error: rErr } = await db.from('results').upsert(resultRow, { onConflict: 'playhq_id' });
      if (rErr) errors.push(`Result ${f.id}: ${rErr.message}`);
      else resultsSynced++;
    }
  }

  log.push(`Fixtures synced: ${fixturesSynced}, Results synced: ${resultsSynced}`);

  // ── 2. Sync ladders (JSONB format — one row per grade) ───────────────────
  let laddersSynced = 0;

  // Group standings by grade
  const byGrade = new Map<string, typeof ladders>();
  for (const row of ladders) {
    if (!byGrade.has(row.grade)) byGrade.set(row.grade, []);
    byGrade.get(row.grade)!.push(row);
  }

  for (const [grade, standings] of byGrade) {
    // Sort by rank (API returns them in order, but be safe)
    standings.sort((a, b) => a.rank - b.rank);

    const jsonRows = standings.map(s => {
      const isWallaroo = s.orgId === WALLAROO_ORG_ID;
      const displayName = isWallaroo ? 'Wallaroo' : s.teamName;
      return {
        pos:       s.rank,
        team:      displayName,
        slug:      isWallaroo ? 'wallaroo' : teamSlug(displayName),
        p:         s.played,
        w:         s.won,
        l:         s.lost,
        d:         s.drawn,
        pct:       s.percentage > 0 ? s.percentage.toFixed(1) : '0.0',
        highlight: isWallaroo,
      };
    });

    const ladderRow = {
      season:        SEASON,
      grade,
      tab_label:     grade,
      display_order: GRADE_ORDER[grade] ?? 99,
      columns:       '%',
      rows:          jsonRows,
      synced_at:     new Date().toISOString(),
    };

    const { error } = await db
      .from('ladders')
      .upsert(ladderRow, { onConflict: 'season,grade' });

    if (error) errors.push(`Ladder ${grade}: ${error.message}`);
    else laddersSynced++;
  }

  log.push(`Ladder grades synced: ${laddersSynced}`);

  // ── 3. Update sync timestamp ────────────────────────────────────────────
  await db.from('site_config').upsert({
    key:   'playhq_last_sync',
    value: new Date().toISOString(),
  });

  return { log, errors };
}

export const POST: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  try {
    const result = await runSync();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status:  result.errors.length ? 207 : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
};

// Allow GET for easy browser/curl testing with ?secret=...
export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  try {
    const result = await runSync();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status:  result.errors.length ? 207 : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
};
