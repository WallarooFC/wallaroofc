/**
 * POST /api/admin/import-players
 *
 * Accepts a batch of parsed PlayHQ registrations split into two arrays:
 *   players  → upserted into the `players` table  (matched on season + playhq_id)
 *   members  → upserted into the `members` table   (matched on season + playhq_id + role)
 *
 * Preserves existing jumper_number / guernsey_id on players if already set.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../lib/supabase';

interface ImportPlayer {
  playhq_id:           string;
  first_name:          string;
  last_name:           string;
  full_name:           string;
  preferred_name?:     string;
  grade:               string;
  dob?:                string;
  jumper_number?:      number | null;
  mobile?:             string;
  emergency_name?:     string;
  emergency_phone?:    string;
  registration_status: string;
  playhq_data:         Record<string, unknown>;
}

interface ImportMember {
  playhq_id:  string;
  first_name: string;
  last_name:  string;
  full_name:  string;
  role:       string;
  team?:      string;
  grade?:     string;
  mobile?:    string;
  email?:     string;
  playhq_data: Record<string, unknown>;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  // ── Auth ────────────────────────────────────────────────────────────────
  const token = cookies.get('sb-access-token')?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const db = getAdminClient();

  let body: { players?: ImportPlayer[]; members?: ImportMember[]; season?: number };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { players = [], members = [], season = 2026 } = body;

  let playersImported = 0;
  let membersImported = 0;
  let errors = 0;
  const errorDetails: string[] = [];

  // ── Upsert players ──────────────────────────────────────────────────────
  for (const p of players) {
    const { data: existing } = await db
      .from('players')
      .select('id, jumper_number, guernsey_id')
      .eq('season', season)
      .eq('playhq_id', p.playhq_id)
      .maybeSingle();

    const row: Record<string, unknown> = {
      season,
      playhq_id:           p.playhq_id,
      first_name:          p.first_name,
      last_name:           p.last_name,
      // full_name is a GENERATED ALWAYS AS column — do not insert/update directly
      grade:               p.grade,
      dob:                 p.dob || null,
      registration_status: p.registration_status,
      mobile:              p.mobile || null,
      emergency_name:      p.emergency_name || null,
      emergency_phone:     p.emergency_phone || null,
      playhq_data:         p.playhq_data ?? {},
    };

    // Preserve existing jumper_number if already set
    if (p.jumper_number && !existing?.jumper_number) {
      row.jumper_number = p.jumper_number;
    }

    const { error } = existing?.id
      ? await db.from('players').update(row).eq('id', existing.id)
      : await db.from('players').insert({ ...row, jumper_number: p.jumper_number || null });

    if (error) {
      errors++;
      errorDetails.push(`Player ${p.full_name}: ${error.message}`);
    } else {
      playersImported++;
    }
  }

  // ── Upsert members (coaches / managers / volunteers) ────────────────────
  for (const m of members) {
    const { data: existing } = await db
      .from('members')
      .select('id')
      .eq('season', season)
      .eq('playhq_id', m.playhq_id)
      .eq('role', m.role)
      .maybeSingle();

    const row: Record<string, unknown> = {
      season,
      playhq_id:  m.playhq_id,
      first_name: m.first_name,
      last_name:  m.last_name,
      full_name:  m.full_name,
      role:       m.role,
      team:       m.team   || null,
      grade:      m.grade  || null,
      mobile:     m.mobile || null,
      email:      m.email  || null,
      status:     'active',
      playhq_data: m.playhq_data ?? {},
    };

    const { error } = existing?.id
      ? await db.from('members').update(row).eq('id', existing.id)
      : await db.from('members').insert(row);

    if (error) {
      errors++;
      errorDetails.push(`Member ${m.full_name} (${m.role}): ${error.message}`);
    } else {
      membersImported++;
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      playersImported,
      membersImported,
      errors,
      errorDetails,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
