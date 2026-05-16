/**
 * Pure functions that normalise the quirks in
 * reference/WFC_2026_Members__Players.xlsx into shapes the migrations
 * accept. Kept in src/lib so vitest can exercise them without spinning
 * up Supabase.
 *
 * Philosophy: flag rather than silently fix. Callers receive a `flags`
 * array so the seed orchestrator can print a single review summary and
 * Thomas can fix the source data in one pass.
 */

import type { CertType, MemberType, Squad, YearInGrade } from "@/lib/db/types";

const HONORIFICS = new Set(["mr", "mrs", "ms", "miss", "dr", "sir", "dame", "rev", "fr"]);

const NA_TOKENS = new Set(["", "n/a", "na", "none", "null", "-", "tbc", "tba"]);

export type ParseFlag = {
  field: string;
  raw: unknown;
  reason: string;
};

export function isMissing(raw: unknown): boolean {
  if (raw === null || raw === undefined) return true;
  if (typeof raw !== "string") return false;
  return NA_TOKENS.has(raw.trim().toLowerCase());
}

export function cleanString(raw: unknown): string | null {
  if (isMissing(raw)) return null;
  return String(raw).trim().replace(/\s+/gu, " ");
}

/**
 * "Mrs June Schofield " -> { firstName: "June", lastName: "Schofield" }
 * "St Mary Mackillop"    -> { firstName: "St Mary", lastName: "Mackillop" }
 * "Madonna"              -> { firstName: "Madonna", lastName: "" } + flag
 */
export function splitFullName(raw: unknown): {
  firstName: string;
  lastName: string;
  flag?: ParseFlag;
} {
  const cleaned = cleanString(raw);
  if (!cleaned) {
    return {
      firstName: "",
      lastName: "",
      flag: { field: "name", raw, reason: "missing or N/A" },
    };
  }
  const tokens = cleaned.split(" ");
  while (tokens.length > 1) {
    const head = tokens[0]!.toLowerCase().replace(/\.$/u, "");
    if (HONORIFICS.has(head)) tokens.shift();
    else break;
  }
  if (tokens.length === 1) {
    return {
      firstName: tokens[0]!,
      lastName: "(unknown)",
      flag: { field: "name", raw, reason: "single-token name; using '(unknown)' for last_name" },
    };
  }
  const lastName = tokens.pop()!;
  return { firstName: tokens.join(" "), lastName };
}

/**
 * The xlsx mixes "Gold Sponsor" / "Gold" / "Life Member" / etc. Map onto
 * the migration's enum; flag unknowns as 'other'.
 */
export function parseMemberType(raw: unknown): { type: MemberType; flag?: ParseFlag } {
  const cleaned = cleanString(raw)?.toLowerCase() ?? "";
  if (!cleaned) {
    return { type: "other", flag: { field: "member_type", raw, reason: "missing" } };
  }

  const direct: Record<string, MemberType> = {
    "life member": "life",
    life: "life",
    senior: "senior",
    "senior member": "senior",
    junior: "junior",
    "junior member": "junior",
    "gold sponsor": "gold_sponsor",
    gold: "gold_sponsor",
    "silver sponsor": "silver_sponsor",
    silver: "silver_sponsor",
    "bronze sponsor": "bronze_sponsor",
    bronze: "bronze_sponsor",
    vip: "vip",
    honorary: "honorary",
    "honorary member": "honorary",
  };
  if (cleaned in direct) return { type: direct[cleaned]! };
  return {
    type: "other",
    flag: { field: "member_type", raw, reason: `unknown type "${cleaned}" -> 'other'` },
  };
}

export function parseSquad(raw: unknown): { squad: Squad; flag?: ParseFlag } | { flag: ParseFlag } {
  const cleaned = cleanString(raw)?.toLowerCase() ?? "";
  const direct: Record<string, Squad> = {
    "snr colts": "snr_colts",
    "senior colts": "snr_colts",
    "jnr colts": "jnr_colts",
    "junior colts": "jnr_colts",
    "under 11s": "u11s",
    "u11s": "u11s",
    "u11": "u11s",
    "under 9s": "u9s",
    "u9s": "u9s",
    "u9": "u9s",
    seniors: "seniors",
    reserves: "reserves",
    "reserve grade": "reserves",
    "a grade": "seniors",
    "b grade": "reserves",
  };
  if (cleaned in direct) return { squad: direct[cleaned]! };
  return { flag: { field: "squad", raw, reason: `unknown squad "${cleaned}"` } };
}

export function parseYearInGrade(raw: unknown): {
  year: YearInGrade | null;
  flag?: ParseFlag;
} {
  const cleaned = cleanString(raw)?.toLowerCase() ?? "";
  if (!cleaned) return { year: null };
  const direct: Record<string, YearInGrade> = {
    "first year": "first",
    first: "first",
    "middle year": "middle",
    middle: "middle",
    "last year": "last",
    last: "last",
    "last year (exempt)": "last_exempt",
    "last exempt": "last_exempt",
  };
  if (cleaned in direct) return { year: direct[cleaned]! };
  return {
    year: null,
    flag: { field: "year_in_grade", raw, reason: `unknown year "${cleaned}"` },
  };
}

/**
 * The xlsx serialises DOBs as "M/D/YY" strings (US-style ordering, two-
 * digit year). Always interpret two-digit years as 2000+ because every
 * junior in the file is born 2010 or later.
 */
export function parseDob(raw: unknown): { iso: string | null; flag?: ParseFlag } {
  const cleaned = cleanString(raw);
  if (!cleaned) return { iso: null };

  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/u.exec(cleaned);
  if (!match) {
    return { iso: null, flag: { field: "dob", raw, reason: "unrecognised date format" } };
  }
  const [, mm, dd, yyRaw] = match;
  const month = Number(mm);
  const day = Number(dd);
  let year = Number(yyRaw);
  if (year < 100) year += 2000;

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { iso: null, flag: { field: "dob", raw, reason: "out-of-range month or day" } };
  }
  const iso = `${year.toString().padStart(4, "0")}-${mm!.padStart(2, "0")}-${dd!.padStart(2, "0")}`;
  return { iso };
}

/**
 * "0409 428 977" -> "+61409428977". "88215800" -> "+61882158800".
 * Anything we can't make sense of comes back null + a flag.
 */
export function parsePhone(raw: unknown): { e164: string | null; flag?: ParseFlag } {
  const cleaned = cleanString(raw);
  if (!cleaned) return { e164: null };
  const digits = cleaned.replace(/[^\d+]/gu, "");
  if (!digits) return { e164: null, flag: { field: "phone", raw, reason: "no digits" } };

  if (digits.startsWith("+61")) {
    if (digits.length < 11 || digits.length > 12) {
      return { e164: null, flag: { field: "phone", raw, reason: "invalid +61 length" } };
    }
    return { e164: digits };
  }
  if (digits.startsWith("61") && (digits.length === 11 || digits.length === 12)) {
    return { e164: `+${digits}` };
  }
  if (digits.startsWith("0")) {
    if (digits.length !== 10) {
      return { e164: null, flag: { field: "phone", raw, reason: "expected 10 digits with leading 0" } };
    }
    return { e164: `+61${digits.slice(1)}` };
  }
  if (digits.length === 9) {
    // Landline without the leading 0, e.g. "888215800" (SA: area code 8 + 8 digits).
    return { e164: `+61${digits}` };
  }
  return { e164: null, flag: { field: "phone", raw, reason: "unrecognised phone shape" } };
}

export function parseEmail(raw: unknown): { email: string | null; flag?: ParseFlag } {
  const cleaned = cleanString(raw);
  if (!cleaned) return { email: null };
  const lowered = cleaned.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(lowered)) {
    return { email: null, flag: { field: "email", raw, reason: "doesn't look like an email" } };
  }
  return { email: lowered };
}

/**
 * Membership numbers in the spreadsheet are sometimes "61, 62, 295" for
 * a sponsor that holds multiple memberships, sometimes "N/A". Surface
 * both as flags; for the multi-number case we keep the first number and
 * note the rest in the flag so the seed can stash them in `notes`.
 */
export function parseMembershipNumber(raw: unknown): {
  number: string | null;
  extras: string[];
  flag?: ParseFlag;
} {
  if (raw === null || raw === undefined) return { number: null, extras: [] };
  const str = String(raw).trim().replace(/\s+/gu, " ");
  if (!str) return { number: null, extras: [] };
  if (NA_TOKENS.has(str.toLowerCase())) {
    return {
      number: null,
      extras: [],
      flag: { field: "member_number", raw, reason: "N/A" },
    };
  }
  const tokens = str
    .split(/[,/&;|]+/u)
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) return { number: null, extras: [] };
  if (tokens.length === 1) return { number: tokens[0]!, extras: [] };
  return {
    number: tokens[0]!,
    extras: tokens.slice(1),
    flag: {
      field: "member_number",
      raw,
      reason: `multiple numbers (${tokens.join(", ")}); kept ${tokens[0]}`,
    },
  };
}

export function trainerLevelToCertType(raw: unknown): CertType {
  const cleaned = cleanString(raw)?.toLowerCase() ?? "";
  if (cleaned.includes("level 2")) return "trainer_level_2";
  if (cleaned.includes("level 1")) return "trainer_level_1";
  if (cleaned.includes("level 0")) return "trainer_level_0";
  return "trainer_level_0";
}
