import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const json = await request.json().catch(() => null);
  if (!json?.slot_id || !json?.name?.trim()) {
    return new Response(JSON.stringify({ ok: false, error: 'slot_id and name are required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const admin = getAdminClient();

  // Verify slot exists, is not filled, and not no_fill
  const { data: slot, error: fetchErr } = await admin
    .from('canteen_slots')
    .select('id, volunteer_name, no_fill, game_day_id')
    .eq('id', json.slot_id)
    .single();

  if (fetchErr || !slot) {
    return new Response(JSON.stringify({ ok: false, error: 'Slot not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (slot.no_fill) {
    return new Response(JSON.stringify({ ok: false, error: 'This spot is not required' }), {
      status: 409, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (slot.volunteer_name) {
    return new Response(JSON.stringify({ ok: false, error: 'This spot is already taken' }), {
      status: 409, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify the game day is active
  const { data: gd } = await admin
    .from('canteen_game_days')
    .select('active, match_date')
    .eq('id', slot.game_day_id)
    .single();

  if (!gd?.active) {
    return new Response(JSON.stringify({ ok: false, error: 'This game day is no longer accepting sign-ups' }), {
      status: 409, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: updated, error: updateErr } = await admin
    .from('canteen_slots')
    .update({
      volunteer_name:  json.name.trim(),
      volunteer_phone: json.phone?.trim() || null,
      volunteer_grade: json.grade?.trim() || null,
      volunteer_notes: json.notes?.trim() || null,
      signed_up_at:    new Date().toISOString(),
    })
    .eq('id', json.slot_id)
    .select()
    .single();

  if (updateErr) {
    return new Response(JSON.stringify({ ok: false, error: updateErr.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, slot: updated }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
