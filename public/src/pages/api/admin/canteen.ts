import type { APIRoute } from 'astro';
import { getAdminClient, supabase } from '../../../lib/supabase';

export const prerender = false;

async function getRole(request: Request) {
  const cookie = request.headers.get('cookie') ?? '';
  const token = cookie.match(/sb-access-token=([^;]+)/)?.[1];
  if (!token) return null;
  const { data } = await supabase.auth.getUser(token);
  if (!data?.user) return null;
  const { data: profile } = await getAdminClient()
    .from('profiles').select('role').eq('id', data.user.id).single();
  return profile?.role ?? null;
}

export const POST: APIRoute = async ({ request }) => {
  const role = await getRole(request);
  if (!role || !['admin', 'committee'].includes(role)) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const json = await request.json().catch(() => null);
  if (!json?.action) {
    return new Response(JSON.stringify({ ok: false, error: 'action required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const admin = getAdminClient();

  // ── clear_slot ─────────────────────────────────────────────
  if (json.action === 'clear_slot') {
    const { error } = await admin.from('canteen_slots').update({
      volunteer_name: null, volunteer_phone: null,
      volunteer_grade: null, volunteer_notes: null,
      signed_up_at: null,
    }).eq('id', json.slot_id);
    if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  // ── set_slot ───────────────────────────────────────────────
  if (json.action === 'set_slot') {
    const { error } = await admin.from('canteen_slots').update({
      volunteer_name:  json.name?.trim() || null,
      volunteer_phone: json.phone?.trim() || null,
      volunteer_grade: json.grade?.trim() || null,
      volunteer_notes: json.notes?.trim() || null,
      signed_up_at:    json.name ? new Date().toISOString() : null,
    }).eq('id', json.slot_id);
    if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  // ── toggle_no_fill ─────────────────────────────────────────
  if (json.action === 'toggle_no_fill') {
    const { data: s } = await admin.from('canteen_slots').select('no_fill').eq('id', json.slot_id).single();
    const { error } = await admin.from('canteen_slots').update({
      no_fill: !s?.no_fill,
      volunteer_name: null, volunteer_phone: null,
      volunteer_grade: null, volunteer_notes: null,
      signed_up_at: null,
    }).eq('id', json.slot_id);
    if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({ ok: true, no_fill: !s?.no_fill }), { headers: { 'Content-Type': 'application/json' } });
  }

  // ── set_shift_rules ───────────────────────────────────────
  // Saves club + eligible_grades for a time_slot template AND
  // bulk-updates every existing canteen_slot with that time_slot.
  if (json.action === 'set_shift_rules') {
    const { time_slot, club, eligible_grades } = json as {
      time_slot: string;
      club: string;
      eligible_grades: string[];
    };
    if (!time_slot) return new Response(JSON.stringify({ ok: false, error: 'time_slot required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    // Upsert template
    const { error: rErr } = await admin.from('canteen_shift_rules').upsert({
      time_slot,
      club:            club            ?? 'any',
      eligible_grades: eligible_grades ?? [],
      updated_at:      new Date().toISOString(),
    });
    if (rErr) return new Response(JSON.stringify({ ok: false, error: rErr.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });

    // Apply to all existing slots
    const { error: sErr } = await admin.from('canteen_slots').update({
      club:            club            ?? 'any',
      eligible_grades: eligible_grades ?? [],
    }).eq('time_slot', time_slot);
    if (sErr) return new Response(JSON.stringify({ ok: false, error: sErr.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  // ── add_game_day ───────────────────────────────────────────
  if (json.action === 'add_game_day') {
    const { data: gd, error: gdErr } = await admin.from('canteen_game_days')
      .insert({ season: 2026, round: json.round, match_date: json.match_date })
      .select().single();
    if (gdErr) return new Response(JSON.stringify({ ok: false, error: gdErr.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });

    // Load shift rules to seed restrictions on new slots
    const { data: rules } = await admin.from('canteen_shift_rules').select('*');
    const ruleMap: Record<string, { club: string; eligible_grades: string[] }> = {};
    for (const r of rules ?? []) ruleMap[r.time_slot] = r;

    // Seed 27 slots
    const timeSlots = [
      { ts: '9.30-11.30', so: 1 },
      { ts: '11.30-1.30', so: 2 },
      { ts: '1.30-3.30',  so: 3 },
    ];
    const stations = [
      { station: 'Till',            station_index: 1, sort_order: 1 },
      { station: 'Serving',         station_index: 1, sort_order: 2 },
      { station: 'Serving',         station_index: 2, sort_order: 3 },
      { station: 'Hot Chips',       station_index: 1, sort_order: 4 },
      { station: 'Hot Chips',       station_index: 2, sort_order: 5 },
      { station: 'Coffee/Pastries', station_index: 1, sort_order: 6 },
      { station: 'Hot Dogs',        station_index: 1, sort_order: 7, no_fill: true },
      { station: 'Hot Dogs',        station_index: 2, sort_order: 8 },
      { station: 'Chicken Burgers', station_index: 1, sort_order: 9 },
    ];
    const rows: any[] = [];
    timeSlots.forEach(({ ts, so }) => {
      const rule = ruleMap[ts];
      stations.forEach(st => {
        rows.push({
          game_day_id:     gd.id,
          time_slot:       ts,
          slot_order:      so,
          station:         st.station,
          station_index:   st.station_index,
          sort_order:      (so - 1) * 9 + st.sort_order,
          no_fill:         ts === '9.30-11.30' && st.no_fill ? true : false,
          club:            rule?.club            ?? 'any',
          eligible_grades: rule?.eligible_grades ?? [],
        });
      });
    });
    await admin.from('canteen_slots').insert(rows);
    return new Response(JSON.stringify({ ok: true, game_day: gd }), { headers: { 'Content-Type': 'application/json' } });
  }

  // ── toggle_game_day ────────────────────────────────────────
  if (json.action === 'toggle_game_day') {
    const { data: gd } = await admin.from('canteen_game_days').select('active').eq('id', json.game_day_id).single();
    await admin.from('canteen_game_days').update({ active: !gd?.active }).eq('id', json.game_day_id);
    return new Response(JSON.stringify({ ok: true, active: !gd?.active }), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ ok: false, error: 'Unknown action' }), {
    status: 400, headers: { 'Content-Type': 'application/json' },
  });
};
