import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AttentionSeverity = "red" | "amber" | "blue" | "green";

export type AttentionItem = {
  id: string;
  severity: AttentionSeverity;
  category: string;
  time: string;
  message: string;
  detail: string;
  cta: string;
  href: string;
};

const TODAY = () => new Date();
const inDays = (n: number) => new Date(Date.now() + n * 86400_000);

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[attention]", (err as Error).message);
    }
    return fallback;
  }
}

export async function getAttentionFeed(limit = 7): Promise<AttentionItem[]> {
  return safe(async () => {
    const supabase = await createSupabaseServerClient();
    const todayIso = TODAY().toISOString().slice(0, 10);
    const in30Iso = inDays(30).toISOString().slice(0, 10);

    const [queue, compliance, packs, milestones] = await Promise.all([
      supabase
        .from("jumper_allocation_queue")
        .select("id, suggested_reason, players(members(first_name, last_name))")
        .eq("status", "pending")
        .order("received_at", { ascending: false }),
      supabase
        .from("compliance_records")
        .select("id, cert_type, expiry_date, members(first_name, last_name)")
        .lte("expiry_date", in30Iso)
        .gte("expiry_date", todayIso),
      supabase
        .from("sponsor_packs")
        .select("id, members(first_name, last_name)")
        .eq("pack_status", "overdue")
        .limit(5),
      supabase
        .from("milestones")
        .select(
          "id, target_game_count, status, players(members(first_name, last_name)), fixtures:projected_fixture_id(match_date, opponent)",
        )
        .in("status", ["upcoming", "imminent"])
        .lte("status", "imminent"),
    ]);

    const items: AttentionItem[] = [];

    type QueueRow = {
      id: string;
      suggested_reason: string | null;
      players: { members: { first_name: string; last_name: string } | null } | null;
    };
    const queueData = (queue.data ?? []) as unknown as QueueRow[];
    if (queueData.length > 0) {
      const names = queueData
        .map((row) =>
          row.players?.members
            ? `${row.players.members.first_name[0]}. ${row.players.members.last_name}`
            : null,
        )
        .filter(Boolean)
        .slice(0, 4)
        .join(" · ");
      items.push({
        id: "queue-pending",
        severity: "red",
        category: "PlayHQ · Rego inbox",
        time: `${queueData.length} awaiting numbers`,
        message: `Auto-parsed from PlayHQ — ${queueData.length} player${queueData.length === 1 ? "" : "s"} need jumper allocation`,
        detail: names || "Open the inbox to review",
        cta: "Allocate",
        href: "/playhq-inbox",
      });
    }

    type ComplianceRow = {
      id: string;
      cert_type: string;
      expiry_date: string;
      members: { first_name: string; last_name: string } | null;
    };
    for (const row of ((compliance.data ?? []) as unknown as ComplianceRow[]).slice(0, 3)) {
      const expiry = new Date(row.expiry_date);
      const daysOut = Math.max(
        0,
        Math.round((expiry.getTime() - TODAY().getTime()) / 86400_000),
      );
      const isCritical = expiry <= inDays(7);
      const name = row.members
        ? `${row.members.first_name} ${row.members.last_name}`
        : "Member";
      items.push({
        id: `comp-${row.id}`,
        severity: isCritical ? "red" : "amber",
        category: `Compliance · ${row.cert_type.replace("_", " ").toUpperCase()}`,
        time: `expires in ${daysOut} days`,
        message: `${name} — ${row.cert_type.replace("_", " ")} valid to ${expiry.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`,
        detail: "Renewal email template is ready to send",
        cta: "Send renewal",
        href: "/compliance",
      });
    }

    type PackRow = {
      id: string;
      members: { first_name: string; last_name: string } | null;
    };
    const packsData = ((packs.data ?? []) as unknown as PackRow[]);
    if (packsData.length > 0) {
      const names = packsData
        .map((row) =>
          row.members ? `${row.members.first_name} ${row.members.last_name}` : null,
        )
        .filter(Boolean)
        .slice(0, 4)
        .join(", ");
      items.push({
        id: "packs-overdue",
        severity: "amber",
        category: "Sponsors · Packs",
        time: `${packsData.length} undelivered`,
        message: `${packsData.length} sponsor pack${packsData.length === 1 ? "" : "s"} marked overdue`,
        detail: names || "Open the tracker for details",
        cta: "Mark delivered",
        href: "/sponsors/packs",
      });
    }

    type MilestoneRow = {
      id: string;
      target_game_count: number | null;
      status: string;
      players: { members: { first_name: string; last_name: string } | null } | null;
      fixtures: { match_date: string; opponent: string | null } | null;
    };
    for (const row of ((milestones.data ?? []) as unknown as MilestoneRow[]).slice(0, 2)) {
      const name = row.players?.members
        ? `${row.players.members.first_name} ${row.players.members.last_name}`
        : "Player";
      items.push({
        id: `milestone-${row.id}`,
        severity: row.status === "imminent" ? "red" : "amber",
        category: "Milestone · Senior",
        time: row.fixtures?.match_date
          ? new Date(row.fixtures.match_date).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
            })
          : "upcoming",
        message: `${name} reaches ${row.target_game_count ?? "milestone"} games`,
        detail: row.fixtures?.opponent
          ? `Round vs ${row.fixtures.opponent} — jumper, guard, media`
          : "Order milestone jumper and arrange guard of honour",
        cta: "Open kit",
        href: "/milestones",
      });
    }

    return items.slice(0, limit);
  }, []);
}
