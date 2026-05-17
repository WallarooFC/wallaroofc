"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordActivity } from "@/lib/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const memberTypeSchema = z.enum([
  "life",
  "senior",
  "junior",
  "gold_sponsor",
  "silver_sponsor",
  "bronze_sponsor",
  "vip",
  "honorary",
  "other",
]);

function blankToNull(value: FormDataEntryValue | null): string | null {
  if (value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

function checkboxOn(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true";
}

const memberSchema = z.object({
  member_number: z.string().trim().min(1).max(40).nullable(),
  member_type: memberTypeSchema,
  first_name: z.string().trim().min(1, "First name is required").max(80),
  last_name: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().email().nullable().or(z.literal(null)),
  phone: z.string().trim().max(40).nullable(),
  postal_address: z.string().trim().max(280).nullable(),
  prefers_post: z.boolean(),
  prefers_email: z.boolean(),
  joined_year: z
    .number()
    .int()
    .min(1880)
    .max(new Date().getFullYear() + 1)
    .nullable(),
  paid_current_season: z.boolean(),
  notes: z.string().trim().max(2000).nullable(),
});

type MemberWrite = z.infer<typeof memberSchema>;

export type MemberFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

function parseFormData(formData: FormData): MemberWrite | { error: MemberFormState } {
  const joinedYearRaw = blankToNull(formData.get("joined_year"));
  const emailRaw = blankToNull(formData.get("email"));

  const parsed = memberSchema.safeParse({
    member_number: blankToNull(formData.get("member_number")),
    member_type: blankToNull(formData.get("member_type")),
    first_name: String(formData.get("first_name") ?? "").trim(),
    last_name: String(formData.get("last_name") ?? "").trim(),
    email: emailRaw === null ? null : emailRaw,
    phone: blankToNull(formData.get("phone")),
    postal_address: blankToNull(formData.get("postal_address")),
    prefers_post: checkboxOn(formData.get("prefers_post")),
    prefers_email: checkboxOn(formData.get("prefers_email")),
    joined_year: joinedYearRaw === null ? null : Number(joinedYearRaw),
    paid_current_season: checkboxOn(formData.get("paid_current_season")),
    notes: blankToNull(formData.get("notes")),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return {
      error: {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors,
      },
    };
  }

  return parsed.data;
}

export async function createMember(
  _prev: MemberFormState | undefined,
  formData: FormData,
): Promise<MemberFormState> {
  const result = parseFormData(formData);
  if ("error" in result) return result.error;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .insert(result as unknown as never)
    .select("id")
    .single();

  if (error || !data) {
    return {
      status: "error",
      message: error?.message ?? "Could not create member.",
    };
  }

  const insertedId = (data as { id: string }).id;
  await recordActivity({
    entity_table: "members",
    entity_id: insertedId,
    action: "create",
    diff: result as unknown as Record<string, unknown>,
  });

  revalidatePath("/members");
  redirect(`/members/${insertedId}`);
}

export async function updateMember(
  id: string,
  _prev: MemberFormState | undefined,
  formData: FormData,
): Promise<MemberFormState> {
  const result = parseFormData(formData);
  if ("error" in result) return result.error;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("members")
    .update(result as unknown as never)
    .eq("id", id);

  if (error) {
    return { status: "error", message: error.message };
  }

  await recordActivity({
    entity_table: "members",
    entity_id: id,
    action: "update",
    diff: result as unknown as Record<string, unknown>,
  });

  revalidatePath("/members");
  revalidatePath(`/members/${id}`);
  redirect(`/members/${id}`);
}

export async function deleteMember(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  await recordActivity({
    entity_table: "members",
    entity_id: id,
    action: "delete",
  });
  revalidatePath("/members");
  redirect("/members");
}
