#!/usr/bin/env node
/**
 * WFC 2026 — Excel → Supabase import
 *
 * Imports:
 *   - Players   (SNR Colts, JNR Colts, U11s, U9s sheets)
 *   - Volunteers + WWCC qualifications  (WWCC sheet)
 *   - Sports trainer qualifications     (Trainers sheet)
 *
 * Run:  node scripts/import-members.js
 * Flags: --dry-run   print what would be inserted without touching the DB
 *        --clean     delete existing season-2026 players / all volunteers first
 */

const XLSX  = require('xlsx');

const SUPABASE_URL     = process.env.PUBLIC_SUPABASE_URL     ?? 'https://linaudktxwrqelngffol.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const EXCEL_FILE       = 'C:/Users/trist/Downloads/WFC 2026 Members & Players.xlsx';

const DRY_RUN = process.argv.includes('--dry-run');
const CLEAN   = process.argv.includes('--clean');

const BASE_HEADERS = {
  'Content-Type' : 'application/json',
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'apikey'       : SERVICE_ROLE_KEY,
};

// ── helpers ─────────────────────────────────────────────────────────────────

/** Excel date serial (days since 1900-01-01, with Lotus bug offset) → ISO date */
function excelDate(serial) {
  if (!serial || typeof serial !== 'number') return null;
  return new Date((serial - 25569) * 86400000).toISOString().split('T')[0];
}

/** "First Last Name" → { first, last } */
function splitName(full) {
  const s = String(full ?? '').trim();
  if (!s) return { first: 'Unknown', last: '' };
  const i = s.indexOf(' ');
  if (i < 0) return { first: s, last: '' };
  return { first: s.slice(0, i), last: s.slice(i + 1).trim() };
}

/** POST rows to a Supabase table; returns the inserted rows (with IDs). */
async function dbInsert(table, rows) {
  if (!rows.length) return [];
  if (DRY_RUN) {
    console.log(`  [dry-run] Would insert ${rows.length} rows into "${table}"`);
    // Return fake rows with sequential fake IDs so later steps don't break
    return rows.map((r, i) => ({ ...r, id: `dry-run-${i}` }));
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method : 'POST',
    headers: { ...BASE_HEADERS, 'Prefer': 'return=representation' },
    body   : JSON.stringify(rows),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`  ERROR inserting into "${table}": HTTP ${res.status}\n  ${text}`);
    return [];
  }
  return await res.json();
}

/** DELETE rows from a table matching a PostgREST filter string. */
async function dbDelete(table, filter) {
  if (DRY_RUN) {
    console.log(`  [dry-run] Would DELETE from "${table}" where ${filter}`);
    return;
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method : 'DELETE',
    headers: BASE_HEADERS,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`  ERROR deleting from "${table}": HTTP ${res.status}\n  ${text}`);
  }
}

// ── grade mapping ────────────────────────────────────────────────────────────

const PLAYER_SHEETS = [
  { sheet: 'SNR Colts 2026', grade: 'Senior Colts' },
  { sheet: 'JNR Colts 2026', grade: 'Junior Colts' },
  { sheet: 'U11s 2026',      grade: 'U11' },
  { sheet: 'U9s 2026',       grade: 'U9' },
];

// ── volunteer role inference ─────────────────────────────────────────────────

function inferRoles(roleStr) {
  const s = roleStr.toLowerCase();
  const roles = [];
  if (s.includes('coach'))                     roles.push('coach');
  if (s.includes('trainer') && !s.includes('team manager')) roles.push('trainer');
  if (s.includes('manager'))                   roles.push('committee');
  if (roles.length === 0)                      roles.push('committee');
  return roles;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('WFC 2026 Member Import');
  if (DRY_RUN) console.log('  *** DRY RUN — no DB changes ***');
  if (CLEAN)   console.log('  *** CLEAN mode — existing data will be deleted first ***');
  console.log('='.repeat(60));

  const wb = XLSX.readFile(EXCEL_FILE);

  // ── Optional clean ────────────────────────────────────────────────────────
  if (CLEAN) {
    console.log('\n[clean] Deleting season-2026 players without a playhq_id…');
    await dbDelete('players', 'season=eq.2026&playhq_id=is.null');

    console.log('[clean] Deleting all volunteers (cascades qualifications)…');
    await dbDelete('volunteers', 'id=not.is.null');
  }

  // ── 1. Players ────────────────────────────────────────────────────────────
  console.log('\n[1/3] PLAYERS');

  const playerRows = [];

  for (const { sheet, grade } of PLAYER_SHEETS) {
    const data = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1 });
    let count = 0;

    for (const row of data.slice(1)) {          // skip header
      const rawName = row[0];
      if (!rawName || String(rawName).trim() === '') continue;

      const { first, last } = splitName(rawName);
      const dob          = excelDate(row[1]);
      const yearInGrade  = String(row[3] ?? '').trim();
      const contactName  = String(row[4] ?? '').trim();
      const contactPhone = String(row[5] ?? '').trim();
      const contactEmail = String(row[6] ?? '').trim();
      const health       = row[7] && row[7] !== 'N/A' ? String(row[7]).trim() : null;

      playerRows.push({
        first_name     : first,
        last_name      : last,
        dob            : dob,
        grade          : grade,
        season         : 2026,
        emergency_name : contactName  || null,
        emergency_phone: contactPhone || null,
        email          : contactEmail || null,    // parent/guardian email for juniors
        playhq_data    : {
          year_in_grade: yearInGrade || null,
          health_notes : health,
          source       : 'excel_import_2026',
        },
      });
      count++;
    }
    console.log(`  ${grade.padEnd(15)} ${count} players`);
  }

  console.log(`  Inserting ${playerRows.length} total players…`);
  const insertedPlayers = await dbInsert('players', playerRows);
  console.log(`  ✓ ${insertedPlayers.length} players saved`);

  // ── 2. Volunteers + WWCC qualifications ───────────────────────────────────
  console.log('\n[2/3] VOLUNTEERS & WWCC QUALIFICATIONS');

  const wwccData  = XLSX.utils.sheet_to_json(wb.Sheets['WWCC'], { header: 1 });
  const volRows   = [];
  // Map full-name → WWCC details (for volunteers that have an SRN)
  const wwccByName = new Map();

  for (const row of wwccData.slice(1)) {
    const rawName = row[1];
    if (!rawName || String(rawName).trim() === '') continue;

    const name    = String(rawName).trim();
    const srn     = row[0] ? String(row[0]).trim() : null;
    const roleStr = String(row[2] ?? '').trim();
    const outcome = row[5] ? String(row[5]).trim() : null;
    const validTo = excelDate(row[6]);

    const { first, last } = splitName(name);

    volRows.push({
      first_name: first,
      last_name : last,
      roles     : inferRoles(roleStr),
      notes     : roleStr || null,
    });

    if (srn) {
      wwccByName.set(name.toLowerCase(), { srn, validTo, outcome });
    }
  }

  console.log(`  Inserting ${volRows.length} volunteers…`);
  const insertedVols = await dbInsert('volunteers', volRows);
  console.log(`  ✓ ${insertedVols.length} volunteers saved`);

  // Build WWCC qualification rows using the returned IDs
  const wwccQualRows = [];
  let wwccMatched = 0;

  for (const vol of insertedVols) {
    const key  = `${vol.first_name} ${vol.last_name}`.toLowerCase();
    const info = wwccByName.get(key);
    if (!info) continue;

    wwccQualRows.push({
      volunteer_id    : vol.id,
      type            : 'wwc',
      reference_number: info.srn,
      expiry_date     : info.validTo,
      verified        : info.outcome === 'Not Prohibited',
      notes           : info.outcome ?? null,
    });
    wwccMatched++;
  }

  console.log(`  Inserting ${wwccQualRows.length} WWCC qualifications…`);
  const insertedWWCC = await dbInsert('qualifications', wwccQualRows);
  console.log(`  ✓ ${insertedWWCC.length} WWCC qualifications saved`);
  if (wwccMatched < wwccByName.size) {
    console.log(`  WARN: ${wwccByName.size - wwccMatched} WWCC record(s) couldn't be matched to a volunteer`);
  }

  // ── 3. Trainer qualifications ─────────────────────────────────────────────
  console.log('\n[3/3] TRAINER QUALIFICATIONS');

  const trainerData = XLSX.utils.sheet_to_json(wb.Sheets['Trainers'], { header: 1 });
  const trainerQualRows = [];

  for (const row of trainerData.slice(1)) {
    const rawName = row[0];
    if (!rawName || String(rawName).trim() === '') continue;

    const name      = String(rawName).trim();
    const level     = row[1] ? String(row[1]).trim() : null;
    const validTo   = excelDate(row[2]);
    const accredNum = row[3] ? String(row[3]).trim() : null;

    const { first, last } = splitName(name);

    // Find matching volunteer (case-insensitive, trimmed)
    const vol = insertedVols.find(v =>
      v.first_name.toLowerCase() === first.toLowerCase() &&
      v.last_name.toLowerCase()  === last.toLowerCase()
    );

    if (!vol) {
      // Try first-name-only match as fallback (handles "Jason Nitotis" vs "Jason Niotis" typos)
      const firstOnly = insertedVols.find(v =>
        v.first_name.toLowerCase() === first.toLowerCase()
      );
      if (firstOnly) {
        console.log(`  WARN: "${name}" matched by first name only → ${firstOnly.first_name} ${firstOnly.last_name}`);
        trainerQualRows.push({
          volunteer_id    : firstOnly.id,
          type            : 'sports_trainer',
          label           : level ?? 'Sports Trainer',
          reference_number: accredNum,
          expiry_date     : validTo,
          verified        : false,
        });
      } else {
        console.log(`  WARN: "${name}" not found in volunteers — skipping`);
      }
      continue;
    }

    trainerQualRows.push({
      volunteer_id    : vol.id,
      type            : 'sports_trainer',
      label           : level ?? 'Sports Trainer',
      reference_number: accredNum,
      expiry_date     : validTo,
      verified        : false,
    });
  }

  console.log(`  Inserting ${trainerQualRows.length} trainer qualifications…`);
  const insertedTQ = await dbInsert('qualifications', trainerQualRows);
  console.log(`  ✓ ${insertedTQ.length} trainer qualifications saved`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`);
  console.log('IMPORT SUMMARY');
  console.log(`  Players imported   : ${insertedPlayers.length}`);
  console.log(`  Volunteers created : ${insertedVols.length}`);
  console.log(`  WWCC checks saved  : ${insertedWWCC.length}`);
  console.log(`  Trainer certs saved: ${insertedTQ.length}`);
  console.log('─'.repeat(60));
  console.log(DRY_RUN
    ? '\n✅ Dry run complete — no data was written.\n'
    : '\n✅ Import complete! Data is now live in Supabase.\n'
  );
}

main().catch(err => {
  console.error('\n❌ Import failed:', err.message);
  process.exit(1);
});
