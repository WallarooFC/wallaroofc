"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordActivity } from "@/lib/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Agendas
// ---------------------------------------------------------------------------

const attendeesSchema = z
  .object({
    present: z.array(z.string()).max(50),
    apologies: z.array(z.string()).max(50),
  })
  .default({ present: [], apologies: [] });

const agendaSchema = z.object({
  meeting_date: z.string().date(),
  meeting_type: z.enum(["committee", "sub_committee", "agm", "sgm"]),
  agenda_markdown: z.string().max(20_000).nullable(),
  minutes_markdown: z.string().max(40_000).nullable(),
  attendees: attendeesSchema,
  published: z.boolean(),
});

export type AgendaFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

function blankToNull(value: FormDataEntryValue | null): string | null {
  if (value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

function csvList(value: FormDataEntryValue | null): string[] {
  const raw = blankToNull(value);
  if (raw === null) return [];
  return raw
    .split(/[\n,]+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

function checkbox(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true";
}

type AgendaParsed = z.infer<typeof agendaSchema>;

function parseAgenda(formData: FormData): AgendaParsed | { error: AgendaFormState } {
  const parsed = agendaSchema.safeParse({
    meeting_date: blankToNull(formData.get("meeting_date")) ?? "",
    meeting_type: blankToNull(formData.get("meeting_type")) ?? "committee",
    agenda_markdown: blankToNull(formData.get("agenda_markdown")),
    minutes_markdown: blankToNull(formData.get("minutes_markdown")),
    attendees: {
      present: csvList(formData.get("attendees_present")),
      apologies: csvList(formData.get("attendees_apologies")),
    },
    published: checkbox(formData.get("published")),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return {
      error: { status: "error", message: "Please fix the highlighted fields.", fieldErrors },
    };
  }
  return parsed.data;
}

export async function createAgenda(
  _prev: AgendaFormState | undefined,
  formData: FormData,
): Promise<AgendaFormState> {
  const result = parseAgenda(formData);
  if ("error" in result) return result.error;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("agendas")
    .insert(result as unknown as never)
    .select("id")
    .single();
  if (error || !data) {
    return { status: "error", message: error?.message ?? "Could not create agenda." };
  }
  const id = (data as { id: string }).id;
  await recordActivity({
    entity_table: "agendas",
    entity_id: id,
    action: "create",
    diff: result as unknown as Record<string, unknown>,
  });
  revalidatePath("/agendas");
  redirect(`/agendas/${id}`);
}

export async function updateAgenda(
  id: string,
  _prev: AgendaFormState | undefined,
  formData: FormData,
): Promise<AgendaFormState> {
  const result = parseAgenda(formData);
  if ("error" in result) return result.error;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("agendas")
    .update(result as unknown as never)
    .eq("id", id);
  if (error) {
    return { status: "error", message: error.message };
  }
  await recordActivity({
    entity_table: "agendas",
    entity_id: id,
    action: "update",
    diff: result as unknown as Record<string, unknown>,
  });
  revalidatePath("/agendas");
  revalidatePath(`/agendas/${id}`);
  redirect(`/agendas/${id}`);
}

export async function deleteAgenda(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("agendas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordActivity({ entity_table: "agendas", entity_id: id, action: "delete" });
  revalidatePath("/agendas");
  redirect("/agendas");
}

export async function togglePublished(id: string, next: boolean): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("agendas")
    .update({ published: next } as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
  await recordActivity({
    entity_table: "agendas",
    entity_id: id,
    action: "update",
    diff: { published: next },
  });
  revalidatePath("/agendas");
  revalidatePath(`/agendas/${id}`);
}

// ---------------------------------------------------------------------------
// Action items
// ---------------------------------------------------------------------------

const actionStatusSchema = z.enum(["open", "in_progress", "done", "cancelled"]);

const actionSchema = z.object({
  agenda_id: z.string().uuid(),
  description: z.string().trim().min(1).max(500),
  due_date: z.string().date().nullable(),
  status: actionStatusSchema,
});

export async function addActionItem(agendaId: string, formData: FormData): Promise<void> {
  const parsed = actionSchema.safeParse({
    agenda_id: agendaId,
    description: blankToNull(formData.get("description")) ?? "",
    due_date: blankToNull(formData.get("due_date")),
    status: blankToNull(formData.get("status")) ?? "open",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid action item");
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("action_items")
    .insert(parsed.data as unknown as never)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Could not add action item");
  }
  await recordActivity({
    entity_table: "action_items",
    entity_id: (data as { id: string }).id,
    action: "create",
    diff: parsed.data as unknown as Record<string, unknown>,
  });
  revalidatePath(`/agendas/${agendaId}`);
}

export async function setActionStatus(
  agendaId: string,
  actionId: string,
  status: z.infer<typeof actionStatusSchema>,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("action_items")
    .update({ status } as never)
    .eq("id", actionId);
  if (error) throw new Error(error.message);
  await recordActivity({
    entity_table: "action_items",
    entity_id: actionId,
    action: "update",
    diff: { status },
  });
  revalidatePath(`/agendas/${agendaId}`);
}

export async function deleteActionItem(agendaId: string, actionId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("action_items").delete().eq("id", actionId);
  if (error) throw new Error(error.message);
  await recordActivity({
    entity_table: "action_items",
    entity_id: actionId,
    action: "delete",
  });
  revalidatePath(`/agendas/${agendaId}`);
}
