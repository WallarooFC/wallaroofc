/**
 * One-time script to update site_config for Round 12 (2026-07-04, AWAY @ Moonta).
 * Run: node scripts/update-config.mjs
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL ?? 'https://linaudktxwrqelngffol.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const updates = [
  { key: 'current_round',             value: '12' },
  { key: 'current_date',              value: 'Sat 4 Jul' },
  { key: 'next_match_date',           value: 'Sat 4 Jul' },
  { key: 'next_match_bounce',         value: '2:40 PM' },
  { key: 'next_match_venue',          value: 'Moonta Oval' },
  { key: 'next_match_home_or_away',   value: 'AWAY' },
  { key: 'next_match_opponent',       value: 'moonta' },
  { key: 'next_match_opponent_name',  value: 'Moonta' },
  { key: 'next_match_opponent_record', value: '6W · 3L · 4th' },
  { key: 'our_record',                value: '2W · 7L · 8th' },
  { key: 'this_week_venue',           value: 'Moonta Oval' },
  { key: 'this_week_venue_label',     value: 'AWAY ROUND' },
  { key: 'last_completed_round',      value: '11' },
];

for (const row of updates) {
  const { error } = await supabase
    .from('site_config')
    .upsert(row, { onConflict: 'key' });
  if (error) {
    console.error(`✗ ${row.key}: ${error.message}`);
  } else {
    console.log(`✓ ${row.key} = ${row.value}`);
  }
}
