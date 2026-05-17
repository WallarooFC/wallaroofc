import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";
import { sendSms, toE164AU } from "@/lib/sms/send";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

/**
 * Match-day Saturday hourly 9am-6pm Adelaide (see vercel.json).
 *
 * For every roster_assignments row that's still 'invited' and was
 * invited more than 24h ago, send a reminder SMS via Twilio and bump
 * reminder_count. Skips politely when SMS_ENABLED=false so the cron
 * stays exercise-able in dev without burning Twilio credits.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HARD_LIMIT_REMINDERS = 3;

type AssignmentShape = {
  id: string;
  status: string;
  invited_at: string | null;
  reminder_count: number;
  members: { first_name: string; phone: string | null } | null;
  roster_shifts: {
    role: string;
    start_time: string | null;
    end_time: string | null;
    fixtures: { match_date: string; opponent: string | null; venue: string | null } | null;
  } | null;
};

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const cutoff = new Date(Date.now() - 24 * 3600_000).toISOString();

  const { data, error } = await supabase
    .from("roster_assignments")
    .select(
      "id, status, invited_at, reminder_count, " +
        "members(first_name, phone), " +
        "roster_shifts(role, start_time, end_time, fixtures(match_date, opponent, venue))",
    )
    .eq("status", "invited")
    .lt("invited_at", cutoff);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as AssignmentShape[];
  const summary = { candidates: rows.length, sent: 0, skipped: 0, failed: 0 };

  for (const row of rows) {
    if (row.reminder_count >= HARD_LIMIT_REMINDERS) {
      summary.skipped += 1;
      continue;
    }
    const phone = toE164AU(row.members?.phone ?? null);
    if (!phone) {
      summary.skipped += 1;
      continue;
    }

    const shift = row.roster_shifts;
    const fixture = shift?.fixtures ?? null;
    const time =
      shift?.start_time && shift?.end_time
        ? ` ${shift.start_time}-${shift.end_time}`
        : "";
    const body =
      `Hi ${row.members?.first_name ?? ""}, Wallaroo FC roster: ` +
      `${shift?.role.replace("_", " ") ?? "shift"}${time} ` +
      `${fixture?.match_date ?? ""}${fixture?.opponent ? ` vs ${fixture.opponent}` : ""}` +
      `${fixture?.venue ? ` @ ${fixture.venue}` : ""}. ` +
      `Reply YES to confirm, NO to decline. Thanks, Thomas.`;

    const result = await sendSms({ to: phone, body });
    if (result.status === "sent") {
      summary.sent += 1;
      await supabase
        .from("roster_assignments")
        .update({ reminder_count: row.reminder_count + 1 } as never)
        .eq("id", row.id);
    } else if (result.status === "skipped") {
      summary.skipped += 1;
    } else {
      summary.failed += 1;
    }
  }

  return NextResponse.json({ ok: true, summary });
}
