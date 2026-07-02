/**
 * PATCH /api/admin/player
 *
 * Updates a player's guernsey or training shirt number.
 * Returns the updated player row and any conflict warnings.
 *
 * Body: { id: string, field: 'jumper_number'|'training_number', value: number|null }
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../lib/supabase';

export const PATCH: APIRoute = async ({ request, cookies }) => {
  // ── Auth ────────────────────────────────────────────────────────────────
  const token = cookies.get('sb-access-token')?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const db = getAdminClient();
  const { data: { user }, error: authErr } = await db.auth.getUser(token);
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data: profile } = await db
    .from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'committee'].includes(profile.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let body: { id?: string; field?: string; value?: any };
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); }

  const { id, field, value } = body;

  if (!id || typeof id !== 'string') {
    return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });
  }
  if (!field || !['jumper_number', 'guernsey_id'].includes(field)) {
    return new Response(JSON.stringify({ error: 'field must be jumper_number or guernsey_id' }), { status: 400 });
  }

  // Both fields are integers; guernsey_id is 1–50, jumper_number is 1–99
  const updateValue: number | null =
    value === null || value === '' || value === undefined
      ? null
      : parseInt(String(value), 10);

  if (updateValue !== null) {
    if (isNaN(updateValue)) {
      return new Response(JSON.stringify({ error: 'Value must be a number' }), { status: 400 });
    }
    if (field === 'jumper_number' && (updateValue < 1 || updateValue > 99)) {
      return new Response(JSON.stringify({ error: 'Guernsey number must be 1–99' }), { status: 400 });
    }
    if (field === 'guernsey_id' && (updateValue < 1 || updateValue > 50)) {
      return new Response(JSON.stringify({ error: 'Guernsey ID must be 1–50' }), { status: 400 });
    }
  }

  // ── Conflict check (guernsey numbers must be unique within a grade) ──────
  let conflict: string | null = null;
  if (updateValue !== null && field === 'jumper_number') {
    const { data: target } = await db
      .from('players').select('grade').eq('id', id).single();

    if (target?.grade) {
      const { data: taken } = await db
        .from('players')
        .select('full_name')
        .eq('grade', target.grade)
        .eq('season', 2026)
        .eq('jumper_number', updateValue)
        .neq('id', id)
        .maybeSingle();

      if (taken) {
        conflict = `#${updateValue} is already assigned to ${taken.full_name} in ${target.grade}`;
      }
    }
  }

  // ── Update ───────────────────────────────────────────────────────────────
  const { data: updated, error: updateErr } = await db
    .from('players')
    .update({ [field]: updateValue })
    .eq('id', id)
    .select('id, first_name, last_name, full_name, grade, jumper_number, guernsey_id')
    .single();

  if (updateErr) {
    return new Response(JSON.stringify({ error: updateErr.message }), { status: 500 });
  }

  return new Response(
    JSON.stringify({ ok: true, player: updated, conflict }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
