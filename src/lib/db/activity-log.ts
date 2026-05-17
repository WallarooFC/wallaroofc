import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActivityRow = {
  id: string;
  actor: string | null;
  actor_name: string | null;
  entity_table: string;
  entity_id: string | null;
  action: string;
  diff: unknown;
  at: string;
};

const PAGE_SIZE = 50;

export async function listActivity({
  page = 0,
  entity,
}: {
  page?: number;
  entity?: string;
}): Promise<{ rows: ActivityRow[]; total: number; pageSize: number }> {
  try {
    const supabase = await createSupabaseServerClient();

    let query = supabase
      .from("activity_log")
      .select("id, actor, entity_table, entity_id, action, diff, at", { count: "exact" });

    if (entity) query = query.eq("entity_table", entity);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count } = await query.order("at", { ascending: false }).range(from, to);

    type Row = Omit<ActivityRow, "actor_name">;
    const rows = (data ?? []) as unknown as Row[];

    // Resolve actor names by joining manually -- the profiles row keyed
    // on user_id is the canonical display source.
    const actorIds = Array.from(
      new Set(rows.map((r) => r.actor).filter(Boolean) as string[]),
    );
    const actorNames = new Map<string, string>();
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", actorIds);
      type Profile = { user_id: string; full_name: string };
      for (const row of (profiles ?? []) as unknown as Profile[]) {
        actorNames.set(row.user_id, row.full_name);
      }
    }

    return {
      rows: rows.map((r) => ({
        ...r,
        actor_name: r.actor ? actorNames.get(r.actor) ?? null : null,
      })),
      total: count ?? 0,
      pageSize: PAGE_SIZE,
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[activity-log.list]", (err as Error).message);
    }
    return { rows: [], total: 0, pageSize: PAGE_SIZE };
  }
}

export async function listActivityEntityTables(): Promise<string[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("activity_log")
      .select("entity_table")
      .order("entity_table", { ascending: true });
    type Row = { entity_table: string };
    const rows = (data ?? []) as unknown as Row[];
    return Array.from(new Set(rows.map((r) => r.entity_table)));
  } catch {
    return [];
  }
}

const ENTITY_LINK_PREFIX: Record<string, string> = {
  members: "/members/",
  players: "/players/",
  jumper_allocation_queue: "/playhq-inbox",
  compliance_records: "/compliance/",
  fixtures: "/fixtures/",
  roster_shifts: "/fixtures/",
  roster_assignments: "/fixtures/",
  sponsor_packs: "/sponsors/packs/",
  milestones: "/milestones/",
  bulldogs_dollars: "/bar-bulldogs/",
  gate_takings: "/gate/",
  agendas: "/agendas/",
  action_items: "/agendas/",
};

export function linkForEntity(entityTable: string, entityId: string | null): string | null {
  const prefix = ENTITY_LINK_PREFIX[entityTable];
  if (!prefix) return null;
  if (!entityId) return prefix.replace(/\/$/u, "");
  return `${prefix}${entityId}`;
}

const ACTION_PILL: Record<string, string> = {
  create: "bg-wfc-status-green/15 text-wfc-status-green",
  update: "bg-wfc-blue/10 text-wfc-blue-deep",
  delete: "bg-wfc-status-red/15 text-wfc-status-red",
  status_change: "bg-wfc-status-amber/15 text-wfc-status-amber",
  issue: "bg-wfc-status-green/15 text-wfc-status-green",
  redeem: "bg-wfc-status-green/15 text-wfc-status-green",
  mail_merge: "bg-wfc-blue/10 text-wfc-blue-deep",
};

export function pillForAction(action: string): string {
  return ACTION_PILL[action] ?? "bg-wfc-grey/15 text-wfc-grey";
}
