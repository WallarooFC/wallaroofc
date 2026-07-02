/**
 * GET|POST /api/sync/results-and-ladder
 *
 * Syncs completed match scores AND ladder standings from PlayHQ in one call.
 * Designed for the Saturday 15-minute polling window (10:15am–6:00pm ACST).
 *
 * Called by:
 *   - Vercel cron — every 15 min, Saturdays 00:45–08:30 UTC (10:15am–6:00pm ACST)
 *   - Admin "Sync Now" button (via POST)
 *   - Manually: curl https://wallaroofc.com.au/api/sync/results-and-ladder?secret=<CRON_SECRET>
 *
 * Responds with:
 *   { ok, resultsSynced, laddersSynced, scores[], errors[] }
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../lib/supabase';
import { getAllGradesData, WALLAROO_ORG_ID } from '../../../lib/playhq';

const SEASON = parseInt(import.meta.env.PLAYHQ_SEASON_YEAR ?? '2026');

const WALLAROO_ORG_ID_LOCAL = WALLAROO_ORG_ID;

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

async function syncResultsAndLadder() {
  const db     = getAdminClient();
  const errors: string[] = [];
  let resultsSynced = 0;
  let laddersSynced = 0;
  const scores: any[] = [];

  // Single PlayHQ fetch for both results and ladders
  const { fixtures, ladders } = await getAllGradesData();

  // ── 1. Sync results ───────────────────────────────────────────────────────
  for (const f of fixtures) {
    // Bye result
    if (f.status === 'bye') {
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
      await db.from('results').upsert(byeRow, { onConflict: 'playhq_id' });
      continue;
    }

    // Completed games with scores
    if (f.status !== 'completed' || f.homeScore === undefined || f.awayScore === undefined) continue;
    if (!f.homeTeam || !f.awayTeam) continue;

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

    const { error } = await db.from('results').upsert(resultRow, { onConflict: 'playhq_id' });
    if (error) {
      errors.push(`Result ${f.id}: ${error.message}`);
    } else {
      resultsSynced++;
      scores.push({
        id:        `result-${f.id}`,
        round:     f.roundNumber,
        grade:     f.grade,
        home:      f.homeTeam.name,
        homeScore: f.homeScore,
        away:      f.awayTeam.name,
        awayScore: f.awayScore,
      });
    }
  }

  // ── 2. Sync ladders ───────────────────────────────────────────────────────
  const byGrade = new Map<string, typeof ladders>();
  for (const row of ladders) {
    if (!byGrade.has(row.grade)) byGrade.set(row.grade, []);
    byGrade.get(row.grade)!.push(row);
  }

  for (const [grade, standings] of byGrade) {
    standings.sort((a, b) => a.rank - b.rank);

    const jsonRows = standings.map(s => {
      const isWallaroo = s.orgId === WALLAROO_ORG_ID_LOCAL;
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

  // ── 3. Update sync timestamps + last completed round ─────────────────────
  const now = new Date().toISOString();
  await db.from('site_config').upsert({ key: 'results_last_sync', value: now });
  await db.from('site_config').upsert({ key: 'ladder_last_sync',  value: now });

  const currentRound = scores.length > 0 ? Math.max(...scores.map(s => s.round)) : 0;

  if (currentRound > 0) {
    await db.from('site_config').upsert({ key: 'last_completed_round', value: String(currentRound) });
  }

  return { resultsSynced, laddersSynced, scores, currentRound, errors };
}

export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  try {
    const result = await syncResultsAndLadder();
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
    const result = await syncResultsAndLadder();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status:  result.errors.length ? 207 : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
};
