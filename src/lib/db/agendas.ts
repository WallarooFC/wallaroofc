import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ActionItemRow,
  ActionItemStatus,
  AgendaRow,
  MeetingType,
} from "@/lib/db/types";

export {
  MEETING_TYPE_OPTIONS,
  MEETING_TYPE_LABEL,
  ACTION_STATUS_OPTIONS,
  ACTION_STATUS_LABEL,
  ACTION_STATUS_PILL,
} from "./agenda-types";

export type AgendaListRow = {
  id: string;
  meeting_date: string;
  meeting_type: MeetingType;
  published: boolean;
  action_item_count: number;
  open_action_count: number;
};

export type AgendaDetail = AgendaRow & {
  action_items: ActionItemRow[];
};

export async function listAgendas(): Promise<AgendaListRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("agendas")
      .select("id, meeting_date, meeting_type, published, action_items(id, status)")
      .order("meeting_date", { ascending: false });

    type Shape = Omit<AgendaListRow, "action_item_count" | "open_action_count"> & {
      action_items: Array<{ id: string; status: ActionItemStatus }> | null;
    };
    const rows = (data ?? []) as unknown as Shape[];
    return rows.map((row) => {
      const items = row.action_items ?? [];
      return {
        ...row,
        action_item_count: items.length,
        open_action_count: items.filter((i) => i.status === "open" || i.status === "in_progress").length,
      };
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[agendas.list]", (err as Error).message);
    }
    return [];
  }
}

export async function getAgenda(id: string): Promise<AgendaDetail | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("agendas")
      .select(
        "id, meeting_date, meeting_type, agenda_markdown, minutes_markdown, attendees, " +
          "published, created_at, updated_at, action_items(id, description, assigned_to, due_date, status, created_at, updated_at, agenda_id)",
      )
      .eq("id", id)
      .maybeSingle();

    type Shape = AgendaRow & { action_items: ActionItemRow[] | null };
    const row = data as unknown as Shape | null;
    if (!row) return null;
    return {
      ...(row as AgendaRow),
      action_items: (row.action_items ?? []).slice().sort((a, b) => {
        if (a.status !== b.status) {
          const order: Record<string, number> = { open: 0, in_progress: 1, done: 2, cancelled: 3 };
          return (order[a.status] ?? 99) - (order[b.status] ?? 99);
        }
        return (a.due_date ?? "").localeCompare(b.due_date ?? "");
      }),
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[agendas.get]", (err as Error).message);
    }
    return null;
  }
}
