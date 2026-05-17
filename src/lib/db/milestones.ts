import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  FixtureRow,
  MilestoneRow,
  MilestoneStatus,
  MilestoneType,
  Squad,
} from "@/lib/db/types";

export type MilestoneListRow = {
  id: string;
  player_id: string | null;
  milestone_type: MilestoneType | null;
  target_game_count: number | null;
  status: MilestoneStatus;
  jumper_ordered: boolean;
  presentation_planned: boolean;
  media_release_sent: boolean;
  notes: string | null;
  projected_fixture_id: string | null;
  player_name: string;
  squad: Squad | null;
  games_played_seniors: number;
  fixture_label: string | null;
  fixture_date: string | null;
};

export type MilestoneDetail = MilestoneRow & {
  player_name: string;
  squad: Squad | null;
  games_played_seniors: number;
  fixture_label: string | null;
  fixture_date: string | null;
};

const LIST_SELECT =
  "id, player_id, milestone_type, target_game_count, status, jumper_ordered, presentation_planned, " +
  "media_release_sent, notes, projected_fixture_id, " +
  "players(squad, games_played_seniors, members(first_name, last_name)), " +
  "fixtures:projected_fixture_id(match_date, opponent, round_number)";

const DETAIL_SELECT =
  "id, player_id, milestone_type, target_game_count, status, jumper_ordered, presentation_planned, " +
  "media_release_sent, notes, projected_fixture_id, created_at, updated_at, " +
  "players(squad, games_played_seniors, members(first_name, last_name)), " +
  "fixtures:projected_fixture_id(match_date, opponent, round_number)";

type ListShape = Omit<
  MilestoneListRow,
  "player_name" | "squad" | "games_played_seniors" | "fixture_label" | "fixture_date"
> & {
  players: {
    squad: Squad;
    games_played_seniors: number;
    members: { first_name: string; last_name: string } | null;
  } | null;
  fixtures: {
    match_date: string;
    opponent: string | null;
    round_number: number | null;
  } | null;
};

type DetailShape = MilestoneRow & {
  players: {
    squad: Squad;
    games_played_seniors: number;
    members: { first_name: string; last_name: string } | null;
  } | null;
  fixtures: {
    match_date: string;
    opponent: string | null;
    round_number: number | null;
  } | null;
};

function fixtureLabel(
  fixture: { round_number: number | null; opponent: string | null } | null,
): string | null {
  if (!fixture) return null;
  return `Rd ${fixture.round_number ?? "?"} vs ${fixture.opponent ?? "TBC"}`;
}

export async function listMilestones(): Promise<MilestoneListRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("milestones")
      .select(LIST_SELECT)
      .order("status", { ascending: true });

    const rows = (data ?? []) as unknown as ListShape[];
    return rows.map((row) => ({
      id: row.id,
      player_id: row.player_id,
      milestone_type: row.milestone_type,
      target_game_count: row.target_game_count,
      status: row.status,
      jumper_ordered: row.jumper_ordered,
      presentation_planned: row.presentation_planned,
      media_release_sent: row.media_release_sent,
      notes: row.notes,
      projected_fixture_id: row.projected_fixture_id,
      player_name: row.players?.members
        ? `${row.players.members.first_name} ${row.players.members.last_name}`
        : "(unknown player)",
      squad: row.players?.squad ?? null,
      games_played_seniors: row.players?.games_played_seniors ?? 0,
      fixture_label: fixtureLabel(row.fixtures),
      fixture_date: row.fixtures?.match_date ?? null,
    }));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[milestones.list]", (err as Error).message);
    }
    return [];
  }
}

export async function getMilestone(id: string): Promise<MilestoneDetail | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("milestones")
      .select(DETAIL_SELECT)
      .eq("id", id)
      .maybeSingle();
    const row = data as unknown as DetailShape | null;
    if (!row) return null;
    return {
      id: row.id,
      player_id: row.player_id,
      milestone_type: row.milestone_type,
      target_game_count: row.target_game_count,
      projected_fixture_id: row.projected_fixture_id,
      status: row.status,
      jumper_ordered: row.jumper_ordered,
      presentation_planned: row.presentation_planned,
      media_release_sent: row.media_release_sent,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      player_name: row.players?.members
        ? `${row.players.members.first_name} ${row.players.members.last_name}`
        : "(unknown player)",
      squad: row.players?.squad ?? null,
      games_played_seniors: row.players?.games_played_seniors ?? 0,
      fixture_label: fixtureLabel(row.fixtures),
      fixture_date: row.fixtures?.match_date ?? null,
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[milestones.get]", (err as Error).message);
    }
    return null;
  }
}

export type PlayerPick = {
  id: string;
  first_name: string;
  last_name: string;
  squad: Squad;
  games_played_seniors: number;
};

export async function listPlayersForMilestone(): Promise<PlayerPick[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("players")
      .select(
        "id, squad, games_played_seniors, members(first_name, last_name)",
      )
      .order("squad", { ascending: true });

    type Shape = {
      id: string;
      squad: Squad;
      games_played_seniors: number;
      members: { first_name: string; last_name: string } | null;
    };
    const rows = (data ?? []) as unknown as Shape[];
    return rows.map((row) => ({
      id: row.id,
      first_name: row.members?.first_name ?? "Unknown",
      last_name: row.members?.last_name ?? "",
      squad: row.squad,
      games_played_seniors: row.games_played_seniors,
    }));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[milestones.playerPicker]", (err as Error).message);
    }
    return [];
  }
}

export type FixturePick = Pick<FixtureRow, "id" | "match_date" | "opponent" | "round_number">;

export async function listFixturesForMilestone(): Promise<FixturePick[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("fixtures")
      .select("id, match_date, opponent, round_number")
      .gte("match_date", today)
      .order("match_date", { ascending: true });
    return (data ?? []) as unknown as FixturePick[];
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[milestones.fixturePicker]", (err as Error).message);
    }
    return [];
  }
}
