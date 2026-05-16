"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordActivity } from "@/lib/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const gateSchema = z.object({
  fixture_id: z.string().uuid().nullable(),
  cash_amount: z.number().nonnegative().max(100_000),
  eftpos_amount: z.number().nonnegative().max(100_000),
  adults_count: z.number().int().nonnegative().max(10_000),
  concessions_count: z.number().int().nonnegative().max(10_000),
  kids_count: z.number().int().nonnegative().max(10_000),
  notes: z.string().trim().max(2000).nullable(),
});

export type GateFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

function blankToNull(value: FormDataEntryValue | null): string | null {
  if (value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

function intOrZero(value: FormDataEntryValue | null): number {
  const raw = blankToNull(value);
  if (raw === null) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function numOrZero(value: FormDataEntryValue | null): number {
  const raw = blankToNull(value);
  if (raw === null) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

type ParsedOk = z.infer<typeof gateSchema>;

function parseForm(
  formData: FormData,
): ParsedOk | { error: Extract<GateFormState, { status: "error" }> } {
  const parsed = gateSchema.safeParse({
    fixture_id: blankToNull(formData.get("fixture_id")),
    cash_amount: numOrZero(formData.get("cash_amount")),
    eftpos_amount: numOrZero(formData.get("eftpos_amount")),
    adults_count: intOrZero(formData.get("adults_count")),
    concessions_count: intOrZero(formData.get("concessions_count")),
    kids_count: intOrZero(formData.get("kids_count")),
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

function toDbShape(parsed: ParsedOk): Record<string, unknown> {
  return {
    fixture_id: parsed.fixture_id,
    cash_amount: parsed.cash_amount.toFixed(2),
    eftpos_amount: parsed.eftpos_amount.toFixed(2),
    adults_count: parsed.adults_count,
    concessions_count: parsed.concessions_count,
    kids_count: parsed.kids_count,
    notes: parsed.notes,
  };
}

export async function createGateTakings(
  _prev: GateFormState | undefined,
  formData: FormData,
): Promise<GateFormState> {
  const result = parseForm(formData);
  if ("error" in result) return result.error;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload = { ...toDbShape(result), recorded_by: user?.id ?? null };
  const { data, error } = await supabase
    .from("gate_takings")
    .insert(payload as unknown as never)
    .select("id")
    .single();
  if (error || !data) {
    return { status: "error", message: error?.message ?? "Could not record takings." };
  }
  const id = (data as { id: string }).id;
  await recordActivity({
    entity_table: "gate_takings",
    entity_id: id,
    action: "create",
    diff: payload as unknown as Record<string, unknown>,
  });
  revalidatePath("/gate");
  revalidatePath("/");
  redirect(`/gate/${id}`);
}

export async function updateGateTakings(
  id: string,
  _prev: GateFormState | undefined,
  formData: FormData,
): Promise<GateFormState> {
  const result = parseForm(formData);
  if ("error" in result) return result.error;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("gate_takings")
    .update(toDbShape(result) as unknown as never)
    .eq("id", id);
  if (error) return { status: "error", message: error.message };
  await recordActivity({
    entity_table: "gate_takings",
    entity_id: id,
    action: "update",
    diff: toDbShape(result) as unknown as Record<string, unknown>,
  });
  revalidatePath("/gate");
  revalidatePath(`/gate/${id}`);
  revalidatePath("/");
  redirect(`/gate/${id}`);
}

export async function deleteGateTakings(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("gate_takings").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordActivity({ entity_table: "gate_takings", entity_id: id, action: "delete" });
  revalidatePath("/gate");
  revalidatePath("/");
  redirect("/gate");
}
