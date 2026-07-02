/**
 * GET /api/sync/results
 *
 * Syncs completed match scores from PlayHQ into Supabase.
 * Lightweight — only upserts result rows; does not touch fixtures or ladders.
 *
 * Called by:
 *   - Vercel cron — daily 05:00 UTC (for overnight final results)
 *   - External cron service every 5 min on Saturdays for live scores
 *     e.g. cron-job.org: GET https://wallaroofc.com.au/api/sync/results?secret=<CRON_SECRET>
 *   - Admin "Sync Scores" button  →  POST with Authorization: Bearer <CRON_SECRET>
 *
 * Responds with:
 *   { ok, synced, currentRound, scores: { round, grade, home, homeScore, away, awayScore }[] }
 * The scores array is consumed by the live results polling on the public results page.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../lib/supabase';
import { getAllGradesData } from '../../../lib/playhq';

const SEASON = parseInt(import.meta.env.PLAYHQ_SEASON_YEAR ?? '2026');

function checkAuth(req: Request): boolean {
  const secret = import.meta.env.CRON_SECRET;
  if (req.headers.get('x-vercel-cron') === '1') return true;
  const auth = req.headers.get('authorization') ?? '';
  if (auth === `Bearer ${secret}` || auth === secret) return true;
  const url = new URL(req.url);
  if (url.searchParams.get('secret') === secret) return true;
  return false;
}

async function syncResults() {
  const db     = getAdminClient();
  const errors: string[] = [];
  let synced = 0;
  const scores: any[] = [];

  const { fixtures } = await getAllGradesData();

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
      synced++;
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

  // Update last sync timestamp
  await db.from('site_config').upsert({
    key:   'results_last_sync',
    value: new Date().toISOString(),
  });

  const currentRound = scores.length > 0 ? Math.max(...scores.map(s => s.round)) : 0;

  return { synced, errors, scores, currentRound };
}

export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  try {
    const result = await syncResults();
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
    const result = await syncResults();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status:  result.errors.length ? 207 : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
};
