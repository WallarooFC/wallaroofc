import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  FixtureRow,
  RosterAssignmentRow,
  RosterRole,
  RosterShiftRow,
  RosterStatus,
  Squad,
} from "@/lib/db/types";

export type FixtureListRow = {
  id: string;
  round_number: number | null;
  match_date: string;
  home_away: "home" | "away" | null;
  opponent: string | null;
  venue: string | null;
  grade: Squad | null;
  notes: string | null;
  shift_count: number;
  assignment_count: number;
};

export type ShiftWithAssignments = RosterShiftRow & {
  assignments: Array<
    Pick<RosterAssignmentRow, "id" | "status" | "member_id"> & {
      member_name: string;
    }
  >;
};

export type FixtureDetail = FixtureRow & {
  shifts: ShiftWithAssignments[];
};

export async function listFixtures(): Promise<FixtureListRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("fixtures")
      .select(
        "id, round_number, match_date, home_away, opponent, venue, grade, notes, roster_shifts(id, roster_assignments(id))",
      )
      .order("match_date", { ascending: true });

    type ListShape = Omit<FixtureListRow, "shift_count" | "assignment_count"> & {
      roster_shifts: Array<{ id: string; roster_assignments: Array<{ id: string }> | null }> | null;
    };
    const rows = (data ?? []) as unknown as ListShape[];

    return rows.map((row) => ({
      ...row,
      shift_count: row.roster_shifts?.length ?? 0,
      assignment_count:
        row.roster_shifts?.reduce(
          (sum, shift) => sum + (shift.roster_assignments?.length ?? 0),
          0,
        ) ?? 0,
    }));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[fixtures.list]", (err as Error).message);
    }
    return [];
  }
}

export async function getFixture(id: string): Promise<FixtureDetail | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("fixtures")
      .select(
        "id, round_number, match_date, home_away, opponent, venue, grade, notes, created_at, updated_at, " +
          "roster_shifts(id, role, start_time, end_time, slots_required, requires_rsa, requires_first_aid, notes, created_at, updated_at, fixture_id, " +
          "roster_assignments(id, status, member_id, members(first_name, last_name)))",
      )
      .eq("id", id)
      .maybeSingle();

    type AssignmentShape = {
      id: string;
      status: RosterStatus;
      member_id: string | null;
      members: { first_name: string; last_name: string } | null;
    };
    type ShiftShape = Omit<RosterShiftRow, "fixture_id" | "created_at" | "updated_at"> & {
      fixture_id: string;
      created_at: string;
      updated_at: string;
      roster_assignments: AssignmentShape[] | null;
    };
    type FixtureShape = FixtureRow & { roster_shifts: ShiftShape[] | null };

    const row = data as unknown as FixtureShape | null;
    if (!row) return null;

    const shifts: ShiftWithAssignments[] = (row.roster_shifts ?? [])
      .slice()
      .sort((a, b) => {
        if (a.role === b.role) return (a.start_time ?? "").localeCompare(b.start_time ?? "");
        return a.role.localeCompare(b.role);
      })
      .map((shift) => ({
        ...shift,
        assignments: (shift.roster_assignments ?? []).map((a) => ({
          id: a.id,
          status: a.status,
          member_id: a.member_id,
          member_name: a.members
            ? `${a.members.first_name} ${a.members.last_name}`
            : "(unknown)",
        })),
      }));

    const fixture: FixtureRow = {
      id: row.id,
      round_number: row.round_number,
      match_date: row.match_date,
      home_away: row.home_away,
      opponent: row.opponent,
      venue: row.venue,
      grade: row.grade,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
    return { ...fixture, shifts };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[fixtures.get]", (err as Error).message);
    }
    return null;
  }
}

export async function listFixturesInRange(
  fromIso: string,
  toIso: string,
): Promise<FixtureDetail[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("fixtures")
      .select(
        "id, round_number, match_date, home_away, opponent, venue, grade, notes, created_at, updated_at, " +
          "roster_shifts(id, role, start_time, end_time, slots_required, requires_rsa, requires_first_aid, notes, created_at, updated_at, fixture_id, " +
          "roster_assignments(id, status, member_id, members(first_name, last_name)))",
      )
      .gte("match_date", fromIso)
      .lte("match_date", toIso)
      .order("match_date", { ascending: true });

    type AssignmentShape = {
      id: string;
      status: RosterStatus;
      member_id: string | null;
      members: { first_name: string; last_name: string } | null;
    };
    type ShiftShape = Omit<RosterShiftRow, "fixture_id" | "created_at" | "updated_at"> & {
      fixture_id: string;
      created_at: string;
      updated_at: string;
      roster_assignments: AssignmentShape[] | null;
    };
    type FixtureShape = FixtureRow & { roster_shifts: ShiftShape[] | null };

    const rows = (data ?? []) as unknown as FixtureShape[];
    return rows.map((row) => ({
      ...(row as FixtureRow),
      shifts: (row.roster_shifts ?? []).map((shift) => ({
        ...shift,
        assignments: (shift.roster_assignments ?? []).map((a) => ({
          id: a.id,
          status: a.status,
          member_id: a.member_id,
          member_name: a.members
            ? `${a.members.first_name} ${a.members.last_name}`
            : "(unknown)",
        })),
      })),
    }));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[fixtures.listRange]", (err as Error).message);
    }
    return [];
  }
}

export type MemberPick = {
  id: string;
  first_name: string;
  last_name: string;
  member_number: string | null;
};

export async function listMembersForRoster(): Promise<MemberPick[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("members")
      .select("id, first_name, last_name, member_number")
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true });
    return (data ?? []) as unknown as MemberPick[];
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[fixtures.members]", (err as Error).message);
    }
    return [];
  }
}

export const ROSTER_ROLE_OPTIONS: ReadonlyArray<{ value: RosterRole; label: string }> = [
  { value: "gate", label: "Gate" },
  { value: "bar", label: "Bar" },
  { value: "canteen", label: "Canteen" },
  { value: "goal_umpire", label: "Goal umpire" },
  { value: "timekeeper", label: "Timekeeper" },
  { value: "first_aid", label: "First aid" },
  { value: "runner", label: "Runner" },
  { value: "boundary_umpire", label: "Boundary umpire" },
];

export const ROSTER_ROLE_LABEL: Record<RosterRole, string> = Object.fromEntries(
  ROSTER_ROLE_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<RosterRole, string>;

export const ROSTER_STATUS_OPTIONS: ReadonlyArray<{ value: RosterStatus; label: string }> = [
  { value: "invited", label: "Invited" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
  { value: "no_response", label: "No response" },
];

export function shiftFillStatus(shift: ShiftWithAssignments): "filled" | "partial" | "empty" {
  const confirmed = shift.assignments.filter((a) => a.status === "confirmed").length;
  if (confirmed >= shift.slots_required) return "filled";
  if (confirmed === 0) return "empty";
  return "partial";
}
