/**
 * Wallaroo FC Secretary Portal — seed runner.
 *
 * Reads reference/WFC_2026_Members__Players.xlsx, normalises rows via the
 * pure parsers in src/lib/seed/parse.ts, and upserts members, junior
 * players, and compliance records. Also links Thomas's profile row if his
 * auth user already exists, and stamps a handful of demo fixtures plus
 * mock PlayHQ inbox entries so the dashboard renders against real data
 * the first time it's opened.
 *
 * Idempotent: members keyed by member_number, players keyed by
 * (squad, dob, first_name, last_name), compliance keyed by
 * (member_id, cert_type), fixtures keyed by (match_date, grade,
 * opponent), profile keyed by user_id.
 *
 * Usage:
 *   pnpm seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in
 * .env.local (the npm script wires Node's --env-file).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

import type { CertType, Database, MemberType, Squad } from "../src/lib/db/types";
import {
  cleanString,
  isMissing,
  parseDob,
  parseEmail,
  parseMembershipNumber,
  parseMemberType,
  parsePhone,
  parseSquad,
  parseYearInGrade,
  splitFullName,
  trainerLevelToCertType,
  type ParseFlag,
} from "../src/lib/seed/parse";

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "[seed] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Add them to .env.local and re-run.",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const flags: Array<{ source: string; identifier: string; flag: ParseFlag }> = [];
const stats = {
  members: { inserted: 0, updated: 0, skipped: 0 },
  players: { inserted: 0, updated: 0, skipped: 0 },
  compliance: { inserted: 0, updated: 0, skipped: 0 },
  fixtures: { inserted: 0, skipped: 0 },
  queue: { inserted: 0, skipped: 0 },
  profile: { linked: false },
};

function flag(source: string, identifier: string, f?: ParseFlag) {
  if (f) flags.push({ source, identifier, flag: f });
}

// ---------------------------------------------------------------------------
// Workbook
// ---------------------------------------------------------------------------

const xlsxPath = resolve(__dirname, "../reference/WFC_2026_Members__Players.xlsx");
const workbook = XLSX.read(readFileSync(xlsxPath), { type: "buffer" });

function readSheet<R extends Record<string, unknown>>(name: string): R[] {
  const sheet = workbook.Sheets[name];
  if (!sheet) {
    console.warn(`[seed] Sheet "${name}" not found in workbook; skipping.`);
    return [];
  }
  return XLSX.utils.sheet_to_json<R>(sheet, { defval: null, raw: false });
}

// ---------------------------------------------------------------------------
// Members from the main "WFC 2026" sheet
// ---------------------------------------------------------------------------

type WfcMemberRow = {
  "Membership Number": string | null;
  "Member's Name": string | null;
  "Membership Type": string | null;
  "Member's Contact Email": string | null;
  "Member's Contact Number": string | null;
  "Member's Postage Address": string | null;
};

type MemberSeed = {
  member_number: string | null;
  member_type: MemberType;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  postal_address: string | null;
  prefers_post: boolean;
  prefers_email: boolean;
  notes: string | null;
  paid_current_season: boolean;
};

async function seedMembers(): Promise<Map<string, string>> {
  const rows = readSheet<WfcMemberRow>("WFC 2026");
  const idByNumber = new Map<string, string>();

  for (const row of rows) {
    const numberParse = parseMembershipNumber(row["Membership Number"]);
    const nameParse = splitFullName(row["Member's Name"]);
    const typeParse = parseMemberType(row["Membership Type"]);
    const emailParse = parseEmail(row["Member's Contact Email"]);
    const phoneParse = parsePhone(row["Member's Contact Number"]);
    const postal = cleanString(row["Member's Postage Address"]);
    const identifier = nameParse.firstName || numberParse.number || "?";

    flag("WFC 2026", identifier, numberParse.flag);
    flag("WFC 2026", identifier, nameParse.flag);
    flag("WFC 2026", identifier, typeParse.flag);
    flag("WFC 2026", identifier, emailParse.flag);
    flag("WFC 2026", identifier, phoneParse.flag);

    if (!nameParse.firstName && !nameParse.lastName) {
      stats.members.skipped += 1;
      continue;
    }

    const noteParts: string[] = [];
    if (numberParse.extras.length > 0) {
      noteParts.push(`additional membership numbers: ${numberParse.extras.join(", ")}`);
    }
    if (isMissing(row["Member's Contact Email"]) && !isMissing(row["Member's Postage Address"])) {
      noteParts.push("prefers post (no email on file)");
    }
    const prefersPost = isMissing(row["Member's Contact Email"]) && !!postal;
    const prefersEmail = !!emailParse.email;

    const seed: MemberSeed = {
      member_number: numberParse.number,
      member_type: typeParse.type,
      first_name: nameParse.firstName,
      last_name: nameParse.lastName || "(unknown)",
      email: emailParse.email,
      phone: phoneParse.e164,
      postal_address: postal,
      prefers_post: prefersPost,
      prefers_email: prefersEmail,
      notes: noteParts.length > 0 ? noteParts.join("; ") : null,
      paid_current_season: true,
    };

    const id = await upsertMember(seed);
    if (id && seed.member_number) idByNumber.set(seed.member_number, id);
  }

  // Members listed on the "Non-Payment" sheet override paid status.
  type NonPaymentRow = WfcMemberRow;
  for (const row of readSheet<NonPaymentRow>("Non-Payment")) {
    const numberParse = parseMembershipNumber(row["Membership Number"]);
    const nameParse = splitFullName(row["Member's Name"]);
    const typeParse = parseMemberType(row["Membership Type"]);
    const identifier = nameParse.firstName || numberParse.number || "?";

    flag("Non-Payment", identifier, numberParse.flag);
    flag("Non-Payment", identifier, nameParse.flag);

    if (!nameParse.firstName) {
      stats.members.skipped += 1;
      continue;
    }

    const id = await upsertMember({
      member_number: numberParse.number,
      member_type: typeParse.type,
      first_name: nameParse.firstName,
      last_name: nameParse.lastName || "(unknown)",
      email: null,
      phone: null,
      postal_address: null,
      prefers_post: false,
      prefers_email: true,
      notes: "Flagged on Non-Payment sheet at seed time.",
      paid_current_season: false,
    });
    if (id && numberParse.number) idByNumber.set(numberParse.number, id);
  }

  return idByNumber;
}

async function upsertMember(seed: MemberSeed): Promise<string | null> {
  // member_number is the natural key when present; otherwise key off
  // (first_name, last_name) to keep this idempotent without unique violations.
  if (seed.member_number) {
    const { data: existing } = await supabase
      .from("members")
      .select("id")
      .eq("member_number", seed.member_number)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("members").update(seed).eq("id", existing.id);
      if (error) {
        console.error(`[seed] member update failed (${seed.member_number}):`, error.message);
        stats.members.skipped += 1;
        return null;
      }
      stats.members.updated += 1;
      return existing.id;
    }
  } else {
    const { data: byName } = await supabase
      .from("members")
      .select("id")
      .eq("first_name", seed.first_name)
      .eq("last_name", seed.last_name)
      .is("member_number", null)
      .maybeSingle();
    if (byName) {
      const { error } = await supabase.from("members").update(seed).eq("id", byName.id);
      if (error) {
        console.error(`[seed] member update failed (${seed.first_name}):`, error.message);
        stats.members.skipped += 1;
        return null;
      }
      stats.members.updated += 1;
      return byName.id;
    }
  }

  const { data: inserted, error } = await supabase
    .from("members")
    .insert(seed)
    .select("id")
    .single();
  if (error || !inserted) {
    console.error(`[seed] member insert failed (${seed.first_name} ${seed.last_name}):`, error?.message);
    stats.members.skipped += 1;
    return null;
  }
  stats.members.inserted += 1;
  return inserted.id;
}

// ---------------------------------------------------------------------------
// Junior players (four squad sheets)
// ---------------------------------------------------------------------------

type SquadRow = {
  "Player's Name": string | null;
  DOB: string | null;
  Grade: string | null;
  Year: string | null;
  "Contact Name"?: string | null;
  " Contact Name"?: string | null;
  "Parent/Guardian"?: string | null;
  "Contact Number"?: string | null;
  " Contact Number"?: string | null;
  "Contact Email"?: string | null;
  " Contact Email"?: string | null;
  Health: string | null;
};

const SQUAD_SHEETS: Array<{ sheet: string; fallback: Squad }> = [
  { sheet: "SNR Colts 2026", fallback: "snr_colts" },
  { sheet: "JNR Colts 2026", fallback: "jnr_colts" },
  { sheet: "U11s 2026", fallback: "u11s" },
  { sheet: "U9s 2026", fallback: "u9s" },
];

async function seedPlayers(): Promise<string[]> {
  const playerIds: string[] = [];

  for (const { sheet, fallback } of SQUAD_SHEETS) {
    const rows = readSheet<SquadRow>(sheet);
    for (const row of rows) {
      const nameParse = splitFullName(row["Player's Name"]);
      const dobParse = parseDob(row.DOB);
      const yearParse = parseYearInGrade(row.Year);
      const squadParse = parseSquad(row.Grade);

      const squad: Squad = "squad" in squadParse ? squadParse.squad : fallback;
      const guardianRaw =
        row["Parent/Guardian"] ?? row["Contact Name"] ?? row[" Contact Name"] ?? null;
      const phoneRaw = row[" Contact Number"] ?? row["Contact Number"] ?? null;
      const emailRaw = row[" Contact Email"] ?? row["Contact Email"] ?? null;
      const phoneParse = parsePhone(phoneRaw);
      const emailParse = parseEmail(emailRaw);
      const guardian = cleanString(guardianRaw);
      const health = cleanString(row.Health);

      const identifier = `${nameParse.firstName} ${nameParse.lastName}`.trim() || "?";
      flag(sheet, identifier, nameParse.flag);
      flag(sheet, identifier, dobParse.flag);
      flag(sheet, identifier, yearParse.flag);
      if ("flag" in squadParse) flag(sheet, identifier, squadParse.flag);
      flag(sheet, identifier, phoneParse.flag);
      flag(sheet, identifier, emailParse.flag);

      if (!nameParse.firstName) {
        stats.players.skipped += 1;
        continue;
      }

      // Players live in `members` too -- juniors get a member row with no
      // membership number so the membership ledger is one consistent source.
      const memberId = await upsertMember({
        member_number: null,
        member_type: "junior",
        first_name: nameParse.firstName,
        last_name: nameParse.lastName || "(unknown)",
        email: emailParse.email,
        phone: phoneParse.e164,
        postal_address: null,
        prefers_post: false,
        prefers_email: !!emailParse.email,
        notes: null,
        paid_current_season: true,
      });

      if (!memberId) {
        stats.players.skipped += 1;
        continue;
      }

      const playerId = await upsertPlayer({
        member_id: memberId,
        squad,
        dob: dobParse.iso,
        year_in_grade: yearParse.year,
        guardian_name: guardian,
        guardian_phone: phoneParse.e164,
        guardian_email: emailParse.email,
        health_flags: health,
        first_name: nameParse.firstName,
        last_name: nameParse.lastName || "(unknown)",
      });
      if (playerId) playerIds.push(playerId);
    }
  }

  return playerIds;
}

type PlayerSeed = {
  member_id: string;
  squad: Squad;
  dob: string | null;
  year_in_grade: ReturnType<typeof parseYearInGrade>["year"];
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  health_flags: string | null;
  first_name: string;
  last_name: string;
};

async function upsertPlayer(seed: PlayerSeed): Promise<string | null> {
  const writeShape = {
    member_id: seed.member_id,
    squad: seed.squad,
    dob: seed.dob,
    year_in_grade: seed.year_in_grade,
    guardian_name: seed.guardian_name,
    guardian_phone: seed.guardian_phone,
    guardian_email: seed.guardian_email,
    health_flags: seed.health_flags,
    registered_current_season: true,
  };

  const { data: existing } = await supabase
    .from("players")
    .select("id")
    .eq("member_id", seed.member_id)
    .eq("squad", seed.squad)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("players").update(writeShape).eq("id", existing.id);
    if (error) {
      console.error(`[seed] player update failed (${seed.first_name}):`, error.message);
      stats.players.skipped += 1;
      return null;
    }
    stats.players.updated += 1;
    return existing.id;
  }

  const { data: inserted, error } = await supabase
    .from("players")
    .insert(writeShape)
    .select("id")
    .single();
  if (error || !inserted) {
    console.error(
      `[seed] player insert failed (${seed.first_name} ${seed.last_name}):`,
      error?.message,
    );
    stats.players.skipped += 1;
    return null;
  }
  stats.players.inserted += 1;
  return inserted.id;
}

// ---------------------------------------------------------------------------
// Compliance — WWCC + Trainers (First Aid + RSA sheets are empty for now)
// ---------------------------------------------------------------------------

type WwccRow = {
  "Person Name": string | null;
  "Club Role": string | null;
  "Date of Birth": string | null;
  "Applicant Type ": string | null;
  Outcome: string | null;
  "Valid To Date": string | null;
};

type TrainerRow = {
  "Person Name": string | null;
  Level: string | null;
  "Valid To Date": string | null;
  "Accredation Number": string | null;
};

async function seedCompliance(memberIdByNumber: Map<string, string>): Promise<void> {
  void memberIdByNumber;

  for (const row of readSheet<WwccRow>("WWCC")) {
    const nameParse = splitFullName(row["Person Name"]);
    if (!nameParse.firstName) {
      stats.compliance.skipped += 1;
      continue;
    }
    const memberId = await findOrStubMember(nameParse.firstName, nameParse.lastName);
    if (!memberId) {
      stats.compliance.skipped += 1;
      continue;
    }
    await upsertCompliance(memberId, {
      cert_type: "wwcc",
      cert_number: null,
      issued_date: null,
      expiry_date: cleanString(row["Valid To Date"]),
      notes: cleanString(row["Club Role"]),
    });
  }

  for (const row of readSheet<TrainerRow>("Trainers")) {
    const nameParse = splitFullName(row["Person Name"]);
    if (!nameParse.firstName) {
      stats.compliance.skipped += 1;
      continue;
    }
    const memberId = await findOrStubMember(nameParse.firstName, nameParse.lastName);
    if (!memberId) {
      stats.compliance.skipped += 1;
      continue;
    }
    await upsertCompliance(memberId, {
      cert_type: trainerLevelToCertType(row.Level),
      cert_number: cleanString(row["Accredation Number"]),
      issued_date: null,
      expiry_date: cleanString(row["Valid To Date"]),
      notes: null,
    });
  }
}

async function findOrStubMember(firstName: string, lastName: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from("members")
    .select("id")
    .eq("first_name", firstName)
    .eq("last_name", lastName)
    .maybeSingle();
  if (existing) return existing.id;

  return upsertMember({
    member_number: null,
    member_type: "other",
    first_name: firstName,
    last_name: lastName,
    email: null,
    phone: null,
    postal_address: null,
    prefers_post: false,
    prefers_email: true,
    notes: "Auto-created from a compliance sheet; no membership record found.",
    paid_current_season: false,
  });
}

type ComplianceSeed = {
  cert_type: CertType;
  cert_number: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  notes: string | null;
};

async function upsertCompliance(memberId: string, seed: ComplianceSeed): Promise<void> {
  const { data: existing } = await supabase
    .from("compliance_records")
    .select("id")
    .eq("member_id", memberId)
    .eq("cert_type", seed.cert_type)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("compliance_records")
      .update({ ...seed, member_id: memberId })
      .eq("id", existing.id);
    if (error) {
      console.error(`[seed] compliance update failed:`, error.message);
      stats.compliance.skipped += 1;
      return;
    }
    stats.compliance.updated += 1;
    return;
  }

  const { error } = await supabase
    .from("compliance_records")
    .insert({ ...seed, member_id: memberId });
  if (error) {
    console.error(`[seed] compliance insert failed:`, error.message);
    stats.compliance.skipped += 1;
    return;
  }
  stats.compliance.inserted += 1;
}

// ---------------------------------------------------------------------------
// Demo fixtures + mock jumper queue rows so the dashboard isn't bare
// ---------------------------------------------------------------------------

const DEMO_FIXTURES: Array<{
  round_number: number;
  match_date: string;
  home_away: "home" | "away";
  opponent: string;
  venue: string;
  grade: Squad;
}> = [
  { round_number: 1, match_date: "2026-04-04", home_away: "home", opponent: "Kadina", venue: "Wallaroo Oval", grade: "seniors" },
  { round_number: 2, match_date: "2026-04-11", home_away: "away", opponent: "Moonta", venue: "Moonta Oval", grade: "seniors" },
  { round_number: 3, match_date: "2026-04-18", home_away: "home", opponent: "Maitland", venue: "Wallaroo Oval", grade: "seniors" },
  { round_number: 4, match_date: "2026-04-25", home_away: "away", opponent: "Central Yorke", venue: "Maitland Oval", grade: "seniors" },
  { round_number: 5, match_date: "2026-05-02", home_away: "home", opponent: "Bute", venue: "Wallaroo Oval", grade: "seniors" },
];

async function seedFixtures(): Promise<void> {
  for (const fixture of DEMO_FIXTURES) {
    const { data: existing } = await supabase
      .from("fixtures")
      .select("id")
      .eq("match_date", fixture.match_date)
      .eq("grade", fixture.grade)
      .eq("opponent", fixture.opponent)
      .maybeSingle();
    if (existing) {
      stats.fixtures.skipped += 1;
      continue;
    }
    const { error } = await supabase.from("fixtures").insert(fixture);
    if (error) {
      console.error(`[seed] fixture insert failed (rnd ${fixture.round_number}):`, error.message);
      continue;
    }
    stats.fixtures.inserted += 1;
  }
}

async function seedJumperQueue(playerIds: string[]): Promise<void> {
  if (playerIds.length === 0) return;

  const samples = playerIds.slice(0, Math.min(3, playerIds.length));
  for (let i = 0; i < samples.length; i += 1) {
    const playerId = samples[i]!;
    const { data: existing } = await supabase
      .from("jumper_allocation_queue")
      .select("id")
      .eq("player_id", playerId)
      .maybeSingle();
    if (existing) {
      stats.queue.skipped += 1;
      continue;
    }
    const suggestedNumber = 10 + i;
    const suggestedReason =
      i === 0 ? "returning · last yr #" + suggestedNumber : i === 1 ? "requested #" + suggestedNumber : "next available";
    const { error } = await supabase.from("jumper_allocation_queue").insert({
      player_id: playerId,
      source: "playhq_email",
      suggested_number: suggestedNumber,
      suggested_reason: suggestedReason,
    });
    if (error) {
      console.error(`[seed] queue insert failed:`, error.message);
      continue;
    }
    stats.queue.inserted += 1;
  }
}

// ---------------------------------------------------------------------------
// Thomas's profile (only if his auth user exists)
// ---------------------------------------------------------------------------

async function seedSecretaryProfile(): Promise<void> {
  const email = "secretary@wallaroofc.com.au";

  // listUsers is paginated. The team is tiny so 1 page is plenty.
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) {
    console.warn(`[seed] could not list auth users (${error.message}); skipping profile link.`);
    return;
  }

  const user = data.users.find((u) => u.email?.toLowerCase() === email);
  if (!user) {
    console.warn(
      `[seed] No auth user for ${email}. Create one via the Supabase dashboard ` +
        "and re-run seed to link the profile.",
    );
    return;
  }

  const { error: upsertError } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      full_name: "Thomas Depledge",
      role: "secretary",
      signature_block: "Thomas Depledge\nClub Secretary\nWallaroo Football Club",
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    console.error(`[seed] profile upsert failed:`, upsertError.message);
    return;
  }
  stats.profile.linked = true;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

async function main() {
  console.log("[seed] Connecting to", url);

  const idByNumber = await seedMembers();
  const playerIds = await seedPlayers();
  await seedCompliance(idByNumber);
  await seedFixtures();
  await seedJumperQueue(playerIds);
  await seedSecretaryProfile();

  console.log();
  console.log("[seed] === Summary ===");
  console.log(`Members      inserted ${stats.members.inserted} | updated ${stats.members.updated} | skipped ${stats.members.skipped}`);
  console.log(`Players      inserted ${stats.players.inserted} | updated ${stats.players.updated} | skipped ${stats.players.skipped}`);
  console.log(`Compliance   inserted ${stats.compliance.inserted} | updated ${stats.compliance.updated} | skipped ${stats.compliance.skipped}`);
  console.log(`Fixtures     inserted ${stats.fixtures.inserted} | skipped ${stats.fixtures.skipped}`);
  console.log(`Queue rows   inserted ${stats.queue.inserted} | skipped ${stats.queue.skipped}`);
  console.log(`Secretary profile linked: ${stats.profile.linked}`);

  if (flags.length > 0) {
    console.log();
    console.log(`[seed] ${flags.length} row(s) flagged for review:`);
    for (const { source, identifier, flag: f } of flags.slice(0, 50)) {
      console.log(`  - ${source} · ${identifier} · ${f.field}: ${f.reason} (raw: ${JSON.stringify(f.raw)})`);
    }
    if (flags.length > 50) {
      console.log(`  ...and ${flags.length - 50} more (truncated).`);
    }
  } else {
    console.log("\n[seed] No rows flagged. Source data is clean.");
  }
}

main().catch((err: unknown) => {
  console.error("[seed] fatal:", err);
  process.exit(1);
});
