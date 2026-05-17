import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JumperStatus, PlayerRow, Squad, YearInGrade } from "@/lib/db/types";

export type PlayerListRow = {
  id: string;
  member_id: string | null;
  squad: Squad;
  dob: string | null;
  year_in_grade: YearInGrade | null;
  jumper_number: number | null;
  jumper_status: JumperStatus;
  last_season_jumper: number | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  registered_current_season: boolean;
  games_played: number;
  games_played_seniors: number;
  first_name: string;
  last_name: string;
  member_number: string | null;
  email: string | null;
};

export type PlayerDetail = PlayerRow & {
  first_name: string | null;
  last_name: string | null;
  member_number: string | null;
  email: string | null;
};

const LIST_SELECT =
  "id, member_id, squad, dob, year_in_grade, jumper_number, jumper_status, last_season_jumper, " +
  "guardian_name, guardian_phone, registered_current_season, games_played, games_played_seniors, " +
  "members(first_name, last_name, member_number, email)";

const DETAIL_SELECT =
  "id, member_id, squad, dob, year_in_grade, guardian_name, guardian_phone, guardian_email, " +
  "health_flags, position_preference, jumper_number, jumper_status, last_season_jumper, " +
  "playhq_registered_at, registered_current_season, games_played, games_played_seniors, " +
  "created_at, updated_at, members(first_name, last_name, member_number, email)";

type ListShape = Omit<PlayerListRow, "first_name" | "last_name" | "member_number" | "email"> & {
  members: { first_name: string; last_name: string; member_number: string | null; email: string | null } | null;
};

type DetailShape = PlayerRow & {
  members: { first_name: string; last_name: string; member_number: string | null; email: string | null } | null;
};

export async function listPlayers(): Promise<PlayerListRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("players")
      .select(LIST_SELECT)
      .order("squad", { ascending: true })
      .order("jumper_number", { ascending: true, nullsFirst: false });

    const rows = (data ?? []) as unknown as ListShape[];
    return rows.map((row) => ({
      ...row,
      first_name: row.members?.first_name ?? "(unknown)",
      last_name: row.members?.last_name ?? "",
      member_number: row.members?.member_number ?? null,
      email: row.members?.email ?? null,
    }));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[players.list]", (err as Error).message);
    }
    return [];
  }
}

export async function getPlayer(id: string): Promise<PlayerDetail | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("players")
      .select(DETAIL_SELECT)
      .eq("id", id)
      .maybeSingle();
    const row = data as unknown as DetailShape | null;
    if (!row) return null;
    return {
      ...row,
      first_name: row.members?.first_name ?? null,
      last_name: row.members?.last_name ?? null,
      member_number: row.members?.member_number ?? null,
      email: row.members?.email ?? null,
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[players.get]", (err as Error).message);
    }
    return null;
  }
}

/**
 * Takes the list output and returns which jumper numbers in 1..maxNumber
 * are taken vs free for each squad. Used by /players/jumpers.
 */
export type JumperMap = {
  squad: Squad;
  range: number[];
  takenByNumber: Map<number, { id: string; name: string; status: JumperStatus }>;
};

export function buildJumperMaps(
  players: PlayerListRow[],
  squadOrder: readonly Squad[],
  maxNumber = 99,
): JumperMap[] {
  return squadOrder.map((squad) => {
    const takenByNumber = new Map<
      number,
      { id: string; name: string; status: JumperStatus }
    >();
    for (const p of players) {
      if (p.squad !== squad || p.jumper_number == null) continue;
      takenByNumber.set(p.jumper_number, {
        id: p.id,
        name: `${p.first_name} ${p.last_name}`.trim(),
        status: p.jumper_status,
      });
    }
    return {
      squad,
      range: Array.from({ length: maxNumber }, (_, i) => i + 1),
      takenByNumber,
    };
  });
}
