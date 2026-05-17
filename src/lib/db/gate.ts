import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GateTakingsRow, Squad } from "@/lib/db/types";

export type GateTakingsListRow = {
  id: string;
  fixture_id: string | null;
  cash_amount: string;
  eftpos_amount: string;
  adults_count: number;
  concessions_count: number;
  kids_count: number;
  notes: string | null;
  recorded_at: string;
  fixture_label: string | null;
  fixture_date: string | null;
  grade: Squad | null;
};

export type GateTakingsDetail = GateTakingsRow & {
  fixture_label: string | null;
  fixture_date: string | null;
  grade: Squad | null;
};

const LIST_SELECT =
  "id, fixture_id, cash_amount, eftpos_amount, adults_count, concessions_count, kids_count, notes, " +
  "recorded_at, fixtures:fixture_id(match_date, opponent, round_number, grade)";

const DETAIL_SELECT =
  "id, fixture_id, cash_amount, eftpos_amount, adults_count, concessions_count, kids_count, notes, " +
  "recorded_at, recorded_by, created_at, updated_at, " +
  "fixtures:fixture_id(match_date, opponent, round_number, grade)";

type ListShape = Omit<GateTakingsListRow, "fixture_label" | "fixture_date" | "grade"> & {
  fixtures:
    | { match_date: string; opponent: string | null; round_number: number | null; grade: Squad | null }
    | null;
};

type DetailShape = GateTakingsRow & {
  fixtures:
    | { match_date: string; opponent: string | null; round_number: number | null; grade: Squad | null }
    | null;
};

function fixtureLabel(
  fixture: { round_number: number | null; opponent: string | null } | null,
): string | null {
  if (!fixture) return null;
  return `Rd ${fixture.round_number ?? "?"} vs ${fixture.opponent ?? "TBC"}`;
}

export async function listGateTakings(): Promise<GateTakingsListRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("gate_takings")
      .select(LIST_SELECT)
      .order("recorded_at", { ascending: false });
    const rows = (data ?? []) as unknown as ListShape[];
    return rows.map((row) => ({
      ...row,
      fixture_label: fixtureLabel(row.fixtures),
      fixture_date: row.fixtures?.match_date ?? null,
      grade: row.fixtures?.grade ?? null,
    }));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[gate.list]", (err as Error).message);
    }
    return [];
  }
}

export async function getGateTakings(id: string): Promise<GateTakingsDetail | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("gate_takings")
      .select(DETAIL_SELECT)
      .eq("id", id)
      .maybeSingle();
    const row = data as unknown as DetailShape | null;
    if (!row) return null;
    return {
      ...row,
      fixture_label: fixtureLabel(row.fixtures),
      fixture_date: row.fixtures?.match_date ?? null,
      grade: row.fixtures?.grade ?? null,
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[gate.get]", (err as Error).message);
    }
    return null;
  }
}

export type GateTotals = {
  totalAud: number;
  cashAud: number;
  eftposAud: number;
  totalAdults: number;
  totalConcessions: number;
  totalKids: number;
  entries: number;
};

export async function getGateTotals(): Promise<GateTotals> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("gate_takings")
      .select("cash_amount, eftpos_amount, adults_count, concessions_count, kids_count");
    type R = {
      cash_amount: string | null;
      eftpos_amount: string | null;
      adults_count: number;
      concessions_count: number;
      kids_count: number;
    };
    const rows = (data ?? []) as unknown as R[];
    let cashAud = 0;
    let eftposAud = 0;
    let totalAdults = 0;
    let totalConcessions = 0;
    let totalKids = 0;
    for (const row of rows) {
      cashAud += Number(row.cash_amount ?? 0);
      eftposAud += Number(row.eftpos_amount ?? 0);
      totalAdults += row.adults_count ?? 0;
      totalConcessions += row.concessions_count ?? 0;
      totalKids += row.kids_count ?? 0;
    }
    return {
      totalAud: cashAud + eftposAud,
      cashAud,
      eftposAud,
      totalAdults,
      totalConcessions,
      totalKids,
      entries: rows.length,
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[gate.totals]", (err as Error).message);
    }
    return {
      totalAud: 0,
      cashAud: 0,
      eftposAud: 0,
      totalAdults: 0,
      totalConcessions: 0,
      totalKids: 0,
      entries: 0,
    };
  }
}

export type FixturePick = {
  id: string;
  match_date: string;
  opponent: string | null;
  round_number: number | null;
  grade: Squad | null;
};

export async function listFixturesForGate(): Promise<FixturePick[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("fixtures")
      .select("id, match_date, opponent, round_number, grade")
      .order("match_date", { ascending: false })
      .limit(40);
    return (data ?? []) as unknown as FixturePick[];
  } catch {
    return [];
  }
}
