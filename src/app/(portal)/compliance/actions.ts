"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordActivity } from "@/lib/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const certTypeSchema = z.enum([
  "wwcc",
  "first_aid",
  "rsa",
  "trainer_level_0",
  "trainer_level_1",
  "trainer_level_2",
  "coach_accred",
  "other",
]);

const complianceSchema = z.object({
  member_id: z.string().uuid().nullable(),
  cert_type: certTypeSchema,
  cert_number: z.string().trim().max(120).nullable(),
  issued_date: z.string().date().nullable(),
  expiry_date: z.string().date().nullable(),
  notes: z.string().trim().max(2000).nullable(),
});

type ComplianceWrite = z.infer<typeof complianceSchema>;

export type ComplianceFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

function blankToNull(value: FormDataEntryValue | null): string | null {
  if (value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

function parseForm(formData: FormData): ComplianceWrite | { error: ComplianceFormState } {
  const parsed = complianceSchema.safeParse({
    member_id: blankToNull(formData.get("member_id")),
    cert_type: blankToNull(formData.get("cert_type")),
    cert_number: blankToNull(formData.get("cert_number")),
    issued_date: blankToNull(formData.get("issued_date")),
    expiry_date: blankToNull(formData.get("expiry_date")),
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

export async function createCompliance(
  _prev: ComplianceFormState | undefined,
  formData: FormData,
): Promise<ComplianceFormState> {
  const result = parseForm(formData);
  if ("error" in result) return result.error;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("compliance_records")
    .insert(result as unknown as never)
    .select("id")
    .single();
  if (error || !data) {
    return { status: "error", message: error?.message ?? "Could not create record." };
  }
  const id = (data as { id: string }).id;
  await recordActivity({
    entity_table: "compliance_records",
    entity_id: id,
    action: "create",
    diff: result as unknown as Record<string, unknown>,
  });
  revalidatePath("/compliance");
  redirect(`/compliance/${id}`);
}

export async function updateCompliance(
  id: string,
  _prev: ComplianceFormState | undefined,
  formData: FormData,
): Promise<ComplianceFormState> {
  const result = parseForm(formData);
  if ("error" in result) return result.error;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("compliance_records")
    .update(result as unknown as never)
    .eq("id", id);
  if (error) {
    return { status: "error", message: error.message };
  }
  await recordActivity({
    entity_table: "compliance_records",
    entity_id: id,
    action: "update",
    diff: result as unknown as Record<string, unknown>,
  });
  revalidatePath("/compliance");
  revalidatePath(`/compliance/${id}`);
  redirect(`/compliance/${id}`);
}

export async function deleteCompliance(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("compliance_records").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordActivity({
    entity_table: "compliance_records",
    entity_id: id,
    action: "delete",
  });
  revalidatePath("/compliance");
  redirect("/compliance");
}
