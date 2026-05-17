import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";
import { CERT_TYPE_LABEL } from "@/lib/db/cert-types";
import { sendEmail, type SendEmailResult } from "@/lib/email/send";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

/**
 * Daily 6am Australia/Adelaide sweep -- see vercel.json.
 *
 * Three jobs, each isolated so a failure in one doesn't poison the others:
 *   1. Compliance expiry reminders at 60/30/14/7/1 days, capped to one
 *      send per record per week (tracked in last_reminder_sent_at).
 *   2. Milestone status: mark `imminent` when target - games_played_seniors
 *      is 3 or fewer.
 *   3. Sponsor packs: flip `to_build` / `built` / `scheduled` rows to
 *      `overdue` once scheduled_delivery is in the past and not delivered.
 *
 * Vercel cron requests carry `Authorization: Bearer <CRON_SECRET>`.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REMINDER_DAYS = [60, 30, 14, 7, 1] as const;
const ONE_WEEK_MS = 7 * 86400_000;

type ComplianceRow = {
  id: string;
  cert_type: keyof typeof CERT_TYPE_LABEL;
  expiry_date: string | null;
  last_reminder_sent_at: string | null;
  members:
    | { first_name: string; last_name: string; email: string | null }
    | null;
};

type MilestoneRow = {
  id: string;
  target_game_count: number | null;
  status: string;
  players:
    | {
        games_played_seniors: number;
        members: { first_name: string; last_name: string } | null;
      }
    | null;
};

type SponsorPackRow = {
  id: string;
  pack_status: string;
  scheduled_delivery: string | null;
};

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const summary = {
    compliance: { scanned: 0, emailsSent: 0, emailsSkipped: 0, errors: 0 },
    milestones: { promoted: 0 },
    sponsorPacks: { markedOverdue: 0 },
  };

  // 1. Compliance reminders ---------------------------------------------------
  try {
    const today = new Date();
    const horizon = new Date(today.getTime() + 60 * 86400_000);
    const todayIso = today.toISOString().slice(0, 10);
    const horizonIso = horizon.toISOString().slice(0, 10);

    const { data } = await supabase
      .from("compliance_records")
      .select(
        "id, cert_type, expiry_date, last_reminder_sent_at, members(first_name, last_name, email)",
      )
      .gte("expiry_date", todayIso)
      .lte("expiry_date", horizonIso);

    const rows = (data ?? []) as unknown as ComplianceRow[];
    summary.compliance.scanned = rows.length;

    for (const row of rows) {
      if (!row.expiry_date || !row.members?.email) {
        summary.compliance.emailsSkipped += 1;
        continue;
      }

      const days = Math.round(
        (new Date(row.expiry_date).getTime() - today.getTime()) / 86400_000,
      );
      if (!REMINDER_DAYS.includes(days as (typeof REMINDER_DAYS)[number])) {
        continue;
      }

      if (
        row.last_reminder_sent_at &&
        Date.now() - new Date(row.last_reminder_sent_at).getTime() < ONE_WEEK_MS
      ) {
        summary.compliance.emailsSkipped += 1;
        continue;
      }

      const certLabel = CERT_TYPE_LABEL[row.cert_type] ?? row.cert_type;
      const result: SendEmailResult = await sendEmail({
        to: row.members.email,
        subject: `${certLabel} renewal — expires in ${days} day${days === 1 ? "" : "s"}`,
        text:
          `Hi ${row.members.first_name},\n\n` +
          `Your ${certLabel} on file with Wallaroo Football Club expires on ${row.expiry_date} ` +
          `(in ${days} day${days === 1 ? "" : "s"}). ` +
          `Please renew it and reply with the new expiry date so we can update your record.\n\n` +
          `Cheers,\n` +
          `Thomas Depledge\n` +
          `Club Secretary, Wallaroo Football Club`,
      });

      if (result.status === "sent") {
        summary.compliance.emailsSent += 1;
        await supabase
          .from("compliance_records")
          .update({ last_reminder_sent_at: new Date().toISOString() } as never)
          .eq("id", row.id);
      } else if (result.status === "skipped") {
        summary.compliance.emailsSkipped += 1;
      } else {
        summary.compliance.errors += 1;
        console.warn("[cron] compliance email failed", row.id, result.error);
      }
    }
  } catch (err) {
    console.error("[cron] compliance sweep failed", (err as Error).message);
    summary.compliance.errors += 1;
  }

  // 2. Milestone status promotion --------------------------------------------
  try {
    const { data } = await supabase
      .from("milestones")
      .select(
        "id, target_game_count, status, players(games_played_seniors, members(first_name, last_name))",
      )
      .eq("status", "upcoming");

    const rows = (data ?? []) as unknown as MilestoneRow[];
    for (const row of rows) {
      if (!row.target_game_count || !row.players) continue;
      const remaining = row.target_game_count - row.players.games_played_seniors;
      if (remaining <= 3) {
        await supabase
          .from("milestones")
          .update({ status: "imminent" } as never)
          .eq("id", row.id);
        summary.milestones.promoted += 1;
      }
    }
  } catch (err) {
    console.error("[cron] milestone sweep failed", (err as Error).message);
  }

  // 3. Sponsor packs overdue ---------------------------------------------------
  try {
    const todayIso = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("sponsor_packs")
      .select("id, pack_status, scheduled_delivery")
      .in("pack_status", ["to_build", "built", "scheduled"])
      .lt("scheduled_delivery", todayIso);
    const rows = (data ?? []) as unknown as SponsorPackRow[];
    if (rows.length > 0) {
      const ids = rows.map((r) => r.id);
      const { error } = await supabase
        .from("sponsor_packs")
        .update({ pack_status: "overdue" } as never)
        .in("id", ids);
      if (!error) summary.sponsorPacks.markedOverdue = ids.length;
    }
  } catch (err) {
    console.error("[cron] sponsor sweep failed", (err as Error).message);
  }

  return NextResponse.json({ ok: true, summary });
}
