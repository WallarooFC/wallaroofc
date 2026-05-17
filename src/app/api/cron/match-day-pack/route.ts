import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";
import { ROSTER_ROLE_LABEL } from "@/lib/db/fixtures";
import { sendEmail } from "@/lib/email/send";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import type { RosterRole, Squad } from "@/lib/db/types";

type RosterShiftSquad = Squad;

/**
 * Friday 7am Adelaide (20:30 UTC Thursday) sweep -- see vercel.json.
 *
 * For every fixture on the upcoming Saturday, email a plain-text
 * "match-day pack" to the secretary inbox: opponent + venue, then every
 * shift with confirmed names and any health flags pulled from the
 * players linked through their members.
 *
 * No PDF generation in v1 -- the email body is the pack. v2 can render
 * to PDF without changing the data flow.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type FixtureShape = {
  id: string;
  match_date: string;
  opponent: string | null;
  venue: string | null;
  round_number: number | null;
  grade: string | null;
  notes: string | null;
  roster_shifts: Array<{
    id: string;
    role: RosterRole;
    start_time: string | null;
    end_time: string | null;
    slots_required: number;
    requires_rsa: boolean;
    requires_first_aid: boolean;
    notes: string | null;
    roster_assignments: Array<{
      status: string;
      members: { first_name: string; last_name: string; phone: string | null } | null;
    }> | null;
  }> | null;
  players?: Array<{ health_flags: string | null; members: { first_name: string; last_name: string } | null }>;
};

function nextSaturdayIso(): string {
  const today = new Date();
  const dow = today.getDay();
  // 6 = Saturday (Sunday is 0). Wrap to the upcoming one.
  const offset = (6 - dow + 7) % 7 || 7;
  const target = new Date(today.getTime() + offset * 86400_000);
  return target.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const target = nextSaturdayIso();

  const { data, error } = await supabase
    .from("fixtures")
    .select(
      "id, match_date, opponent, venue, round_number, grade, notes, " +
        "roster_shifts(id, role, start_time, end_time, slots_required, requires_rsa, requires_first_aid, notes, " +
        "roster_assignments(status, members(first_name, last_name, phone)))",
    )
    .eq("match_date", target);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const fixtures = (data ?? []) as unknown as FixtureShape[];
  const summary = { fixturesFound: fixtures.length, emailsSent: 0, emailsFailed: 0 };

  for (const fixture of fixtures) {
    const bodyLines: string[] = [];
    const matchLabel =
      `Round ${fixture.round_number ?? "?"} ` +
      `${fixture.grade ? `(${fixture.grade.replace("_", " ")}) ` : ""}` +
      `vs ${fixture.opponent ?? "TBC"}`;

    bodyLines.push(matchLabel);
    bodyLines.push(`${target}${fixture.venue ? ` @ ${fixture.venue}` : ""}`);
    if (fixture.notes) {
      bodyLines.push("");
      bodyLines.push(`Notes: ${fixture.notes}`);
    }

    bodyLines.push("");
    bodyLines.push("Roster");
    bodyLines.push("---");
    const shifts = fixture.roster_shifts ?? [];
    if (shifts.length === 0) {
      bodyLines.push("(no shifts configured)");
    } else {
      for (const shift of shifts) {
        const time =
          shift.start_time && shift.end_time
            ? `${shift.start_time}-${shift.end_time}`
            : "all day";
        const confirmedNames = (shift.roster_assignments ?? [])
          .filter((a) => a.status === "confirmed" && a.members)
          .map((a) => `${a.members!.first_name} ${a.members!.last_name}`);
        const tags = [
          shift.requires_rsa ? "RSA" : null,
          shift.requires_first_aid ? "First aid" : null,
        ]
          .filter(Boolean)
          .join(" / ");
        const headline = `${ROSTER_ROLE_LABEL[shift.role] ?? shift.role} ${time} (${confirmedNames.length}/${shift.slots_required})${tags ? ` [${tags}]` : ""}`;
        bodyLines.push(headline);
        if (confirmedNames.length > 0) {
          bodyLines.push(`  ${confirmedNames.join(", ")}`);
        }
      }
    }

    // Health flags from junior players in this grade (or all squads if no grade).
    const playersQuery = supabase
      .from("players")
      .select("health_flags, members(first_name, last_name)")
      .not("health_flags", "is", null)
      .neq("health_flags", "")
      .neq("health_flags", "N/A");
    const { data: playersData } = fixture.grade
      ? await playersQuery.eq("squad", fixture.grade as RosterShiftSquad)
      : await playersQuery;
    type PlayerRow = {
      health_flags: string | null;
      members: { first_name: string; last_name: string } | null;
    };
    const players = (playersData ?? []) as unknown as PlayerRow[];
    if (players.length > 0) {
      bodyLines.push("");
      bodyLines.push("Health flags");
      bodyLines.push("---");
      for (const p of players) {
        const name = p.members
          ? `${p.members.first_name} ${p.members.last_name}`
          : "Player";
        bodyLines.push(`${name}: ${p.health_flags}`);
      }
    }

    const result = await sendEmail({
      to: env.RESEND_FROM_EMAIL,
      subject: `Match-day pack — ${matchLabel} (${target})`,
      text: bodyLines.join("\n"),
    });
    if (result.status === "sent") summary.emailsSent += 1;
    else if (result.status !== "skipped") summary.emailsFailed += 1;
  }

  return NextResponse.json({ ok: true, target, summary });
}
