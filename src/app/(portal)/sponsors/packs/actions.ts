"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordActivity } from "@/lib/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const statusSchema = z.enum(["to_build", "built", "scheduled", "delivered", "overdue"]);

const itemSchema = z.object({
  item: z.string().trim().min(1).max(80),
  qty: z.number().int().min(1).max(999),
});

const packSchema = z.object({
  member_id: z.string().uuid(),
  season: z.number().int().min(2000).max(2100),
  pack_status: statusSchema,
  contents: z.array(itemSchema),
  scheduled_delivery: z.string().date().nullable(),
  delivered_at: z.string().date().nullable(),
  notes: z.string().trim().max(2000).nullable(),
});

type PackWrite = z.infer<typeof packSchema>;

export type PackFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

function blankToNull(value: FormDataEntryValue | null): string | null {
  if (value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

function intOrNull(value: FormDataEntryValue | null): number | null {
  const raw = blankToNull(value);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseContents(raw: FormDataEntryValue | null): Array<{ item: string; qty: number }> {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw)) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: Array<{ item: string; qty: number }> = [];
    for (const candidate of parsed) {
      if (
        candidate &&
        typeof candidate === "object" &&
        typeof (candidate as { item?: unknown }).item === "string" &&
        Number.isFinite(Number((candidate as { qty?: unknown }).qty))
      ) {
        const item = String((candidate as { item: string }).item).trim();
        const qty = Math.trunc(Number((candidate as { qty: unknown }).qty));
        if (item && qty >= 1) out.push({ item, qty });
      }
    }
    return out;
  } catch {
    return [];
  }
}

function parseForm(formData: FormData): PackWrite | { error: PackFormState } {
  const parsed = packSchema.safeParse({
    member_id: blankToNull(formData.get("member_id")),
    season: intOrNull(formData.get("season")) ?? new Date().getFullYear(),
    pack_status: blankToNull(formData.get("pack_status")) ?? "to_build",
    contents: parseContents(formData.get("contents")),
    scheduled_delivery: blankToNull(formData.get("scheduled_delivery")),
    delivered_at: blankToNull(formData.get("delivered_at")),
    notes: blankToNull(formData.get("notes")),
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

export async function createSponsorPack(
  _prev: PackFormState | undefined,
  formData: FormData,
): Promise<PackFormState> {
  const result = parseForm(formData);
  if ("error" in result) return result.error;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sponsor_packs")
    .insert(result as unknown as never)
    .select("id")
    .single();
  if (error || !data) {
    return { status: "error", message: error?.message ?? "Could not create pack." };
  }
  const id = (data as { id: string }).id;
  await recordActivity({
    entity_table: "sponsor_packs",
    entity_id: id,
    action: "create",
    diff: result as unknown as Record<string, unknown>,
  });
  revalidatePath("/sponsors");
  revalidatePath("/sponsors/packs");
  redirect(`/sponsors/packs/${id}`);
}

export async function updateSponsorPack(
  id: string,
  _prev: PackFormState | undefined,
  formData: FormData,
): Promise<PackFormState> {
  const result = parseForm(formData);
  if ("error" in result) return result.error;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("sponsor_packs")
    .update(result as unknown as never)
    .eq("id", id);
  if (error) {
    return { status: "error", message: error.message };
  }
  await recordActivity({
    entity_table: "sponsor_packs",
    entity_id: id,
    action: "update",
    diff: result as unknown as Record<string, unknown>,
  });
  revalidatePath("/sponsors");
  revalidatePath("/sponsors/packs");
  revalidatePath(`/sponsors/packs/${id}`);
  redirect(`/sponsors/packs/${id}`);
}

export async function deleteSponsorPack(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("sponsor_packs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordActivity({
    entity_table: "sponsor_packs",
    entity_id: id,
    action: "delete",
  });
  revalidatePath("/sponsors");
  revalidatePath("/sponsors/packs");
  redirect("/sponsors/packs");
}

export async function advancePackStatus(
  id: string,
  next: z.infer<typeof statusSchema>,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const update: Record<string, unknown> = { pack_status: next };
  if (next === "delivered") {
    update.delivered_at = new Date().toISOString().slice(0, 10);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) update.delivered_by = user.id;
  }
  const { error } = await supabase
    .from("sponsor_packs")
    .update(update as never)
    .eq("id", id);
  if (error) throw new Error(error.message);

  await recordActivity({
    entity_table: "sponsor_packs",
    entity_id: id,
    action: "status_change",
    diff: update,
  });
  revalidatePath("/sponsors/packs");
  revalidatePath(`/sponsors/packs/${id}`);
  revalidatePath("/");
}
