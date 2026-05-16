"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordActivity } from "@/lib/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Fixture CRUD
// ---------------------------------------------------------------------------

const gradeSchema = z
  .enum(["seniors", "reserves", "snr_colts", "jnr_colts", "u11s", "u9s"])
  .nullable();
const homeAwaySchema = z.enum(["home", "away"]).nullable();

const fixtureSchema = z.object({
  round_number: z.number().int().min(0).max(40).nullable(),
  match_date: z.string().date(),
  home_away: homeAwaySchema,
  opponent: z.string().trim().max(120).nullable(),
  venue: z.string().trim().max(120).nullable(),
  grade: gradeSchema,
  notes: z.string().trim().max(2000).nullable(),
});

type FixtureWrite = z.infer<typeof fixtureSchema>;

export type FixtureFormState =
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

function checkbox(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true";
}

function parseFixtureForm(formData: FormData): FixtureWrite | { error: FixtureFormState } {
  const parsed = fixtureSchema.safeParse({
    round_number: intOrNull(formData.get("round_number")),
    match_date: blankToNull(formData.get("match_date")) ?? "",
    home_away: blankToNull(formData.get("home_away")),
    opponent: blankToNull(formData.get("opponent")),
    venue: blankToNull(formData.get("venue")),
    grade: blankToNull(formData.get("grade")),
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

export async function createFixture(
  _prev: FixtureFormState | undefined,
  formData: FormData,
): Promise<FixtureFormState> {
  const result = parseFixtureForm(formData);
  if ("error" in result) return result.error;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("fixtures")
    .insert(result as unknown as never)
    .select("id")
    .single();
  if (error || !data) {
    return { status: "error", message: error?.message ?? "Could not create fixture." };
  }
  const id = (data as { id: string }).id;
  await recordActivity({
    entity_table: "fixtures",
    entity_id: id,
    action: "create",
    diff: result as unknown as Record<string, unknown>,
  });
  revalidatePath("/fixtures");
  revalidatePath("/rosters");
  redirect(`/fixtures/${id}`);
}

export async function updateFixture(
  id: string,
  _prev: FixtureFormState | undefined,
  formData: FormData,
): Promise<FixtureFormState> {
  const result = parseFixtureForm(formData);
  if ("error" in result) return result.error;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("fixtures")
    .update(result as unknown as never)
    .eq("id", id);
  if (error) {
    return { status: "error", message: error.message };
  }
  await recordActivity({
    entity_table: "fixtures",
    entity_id: id,
    action: "update",
    diff: result as unknown as Record<string, unknown>,
  });
  revalidatePath("/fixtures");
  revalidatePath(`/fixtures/${id}`);
  revalidatePath("/rosters");
  redirect(`/fixtures/${id}`);
}

export async function deleteFixture(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("fixtures").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordActivity({
    entity_table: "fixtures",
    entity_id: id,
    action: "delete",
  });
  revalidatePath("/fixtures");
  revalidatePath("/rosters");
  redirect("/fixtures");
}

// ---------------------------------------------------------------------------
// Shifts
// ---------------------------------------------------------------------------

const roleSchema = z.enum([
  "gate",
  "bar",
  "canteen",
  "goal_umpire",
  "timekeeper",
  "first_aid",
  "runner",
  "boundary_umpire",
]);

const shiftSchema = z.object({
  fixture_id: z.string().uuid(),
  role: roleSchema,
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/u).nullable(),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/u).nullable(),
  slots_required: z.number().int().min(1).max(20),
  requires_rsa: z.boolean(),
  requires_first_aid: z.boolean(),
  notes: z.string().trim().max(500).nullable(),
});

export async function createShift(fixtureId: string, formData: FormData): Promise<void> {
  const parsed = shiftSchema.safeParse({
    fixture_id: fixtureId,
    role: blankToNull(formData.get("role")),
    start_time: blankToNull(formData.get("start_time")),
    end_time: blankToNull(formData.get("end_time")),
    slots_required: intOrNull(formData.get("slots_required")) ?? 1,
    requires_rsa: checkbox(formData.get("requires_rsa")),
    requires_first_aid: checkbox(formData.get("requires_first_aid")),
    notes: blankToNull(formData.get("notes")),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid shift");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("roster_shifts")
    .insert(parsed.data as unknown as never)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Could not create shift");
  }
  await recordActivity({
    entity_table: "roster_shifts",
    entity_id: (data as { id: string }).id,
    action: "create",
    diff: parsed.data as unknown as Record<string, unknown>,
  });
  revalidatePath(`/fixtures/${fixtureId}`);
  revalidatePath("/rosters");
}

export async function deleteShift(fixtureId: string, shiftId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("roster_shifts").delete().eq("id", shiftId);
  if (error) throw new Error(error.message);
  await recordActivity({
    entity_table: "roster_shifts",
    entity_id: shiftId,
    action: "delete",
  });
  revalidatePath(`/fixtures/${fixtureId}`);
  revalidatePath("/rosters");
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

const assignmentSchema = z.object({
  shift_id: z.string().uuid(),
  member_id: z.string().uuid(),
  status: z.enum(["invited", "confirmed", "declined", "no_response"]),
});

export async function addAssignment(
  fixtureId: string,
  shiftId: string,
  formData: FormData,
): Promise<void> {
  const parsed = assignmentSchema.safeParse({
    shift_id: shiftId,
    member_id: blankToNull(formData.get("member_id")),
    status: blankToNull(formData.get("status")) ?? "invited",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid assignment");
  }
  const payload = {
    ...parsed.data,
    invited_at: new Date().toISOString(),
  };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("roster_assignments")
    .insert(payload as unknown as never)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Could not add assignment");
  }
  await recordActivity({
    entity_table: "roster_assignments",
    entity_id: (data as { id: string }).id,
    action: "create",
    diff: payload as unknown as Record<string, unknown>,
  });
  revalidatePath(`/fixtures/${fixtureId}`);
  revalidatePath("/rosters");
}

export async function setAssignmentStatus(
  fixtureId: string,
  assignmentId: string,
  status: "invited" | "confirmed" | "declined" | "no_response",
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const responded =
    status === "confirmed" || status === "declined" ? new Date().toISOString() : null;
  const { error } = await supabase
    .from("roster_assignments")
    .update({ status, responded_at: responded } as never)
    .eq("id", assignmentId);
  if (error) throw new Error(error.message);
  await recordActivity({
    entity_table: "roster_assignments",
    entity_id: assignmentId,
    action: "update",
    diff: { status },
  });
  revalidatePath(`/fixtures/${fixtureId}`);
  revalidatePath("/rosters");
}

export async function removeAssignment(
  fixtureId: string,
  assignmentId: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("roster_assignments").delete().eq("id", assignmentId);
  if (error) throw new Error(error.message);
  await recordActivity({
    entity_table: "roster_assignments",
    entity_id: assignmentId,
    action: "delete",
  });
  revalidatePath(`/fixtures/${fixtureId}`);
  revalidatePath("/rosters");
}
