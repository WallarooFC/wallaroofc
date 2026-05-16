"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordActivity } from "@/lib/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const squadSchema = z.enum(["seniors", "reserves", "snr_colts", "jnr_colts", "u11s", "u9s"]);
const yearSchema = z.enum(["first", "middle", "last", "last_exempt"]).nullable();
const jumperStatusSchema = z.enum(["pending", "suggested", "confirmed", "retired"]);

const playerSchema = z.object({
  squad: squadSchema,
  dob: z.string().date().or(z.literal("")).transform((v) => (v === "" ? null : v)).nullable(),
  year_in_grade: yearSchema,
  guardian_name: z.string().trim().max(120).nullable(),
  guardian_phone: z.string().trim().max(40).nullable(),
  guardian_email: z.string().trim().email().nullable().or(z.literal(null)),
  health_flags: z.string().trim().max(500).nullable(),
  position_preference: z.string().trim().max(80).nullable(),
  jumper_number: z
    .number()
    .int()
    .min(1)
    .max(199)
    .nullable(),
  jumper_status: jumperStatusSchema,
  last_season_jumper: z
    .number()
    .int()
    .min(1)
    .max(199)
    .nullable(),
  registered_current_season: z.boolean(),
  games_played: z.number().int().min(0).max(1000),
  games_played_seniors: z.number().int().min(0).max(1000),
});

type PlayerWrite = z.infer<typeof playerSchema>;

export type PlayerFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

function blankToNull(value: FormDataEntryValue | null): string | null {
  if (value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

function checkbox(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true";
}

function intOrNull(value: FormDataEntryValue | null): number | null {
  const str = blankToNull(value);
  if (str === null) return null;
  const num = Number(str);
  return Number.isFinite(num) ? Math.trunc(num) : null;
}

function parseForm(formData: FormData): PlayerWrite | { error: PlayerFormState } {
  const emailRaw = blankToNull(formData.get("guardian_email"));
  const parsed = playerSchema.safeParse({
    squad: blankToNull(formData.get("squad")),
    dob: blankToNull(formData.get("dob")) ?? "",
    year_in_grade: blankToNull(formData.get("year_in_grade")),
    guardian_name: blankToNull(formData.get("guardian_name")),
    guardian_phone: blankToNull(formData.get("guardian_phone")),
    guardian_email: emailRaw === null ? null : emailRaw,
    health_flags: blankToNull(formData.get("health_flags")),
    position_preference: blankToNull(formData.get("position_preference")),
    jumper_number: intOrNull(formData.get("jumper_number")),
    jumper_status: blankToNull(formData.get("jumper_status")) ?? "pending",
    last_season_jumper: intOrNull(formData.get("last_season_jumper")),
    registered_current_season: checkbox(formData.get("registered_current_season")),
    games_played: intOrNull(formData.get("games_played")) ?? 0,
    games_played_seniors: intOrNull(formData.get("games_played_seniors")) ?? 0,
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

export async function updatePlayer(
  id: string,
  _prev: PlayerFormState | undefined,
  formData: FormData,
): Promise<PlayerFormState> {
  const result = parseForm(formData);
  if ("error" in result) return result.error;

  // If a jumper number is set, verify it's free in that squad (or assigned
  // to this same player). Database has a partial unique index but we want
  // a friendly message instead of a 23505.
  if (result.jumper_number !== null) {
    const supabase = await createSupabaseServerClient();
    const { data: conflict } = await supabase
      .from("players")
      .select("id")
      .eq("squad", result.squad)
      .eq("jumper_number", result.jumper_number)
      .neq("id", id)
      .maybeSingle();
    if (conflict) {
      return {
        status: "error",
        message: `Jumper #${result.jumper_number} is already taken in ${result.squad}.`,
        fieldErrors: { jumper_number: "Taken in this squad" },
      };
    }
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("players")
    .update(result as unknown as never)
    .eq("id", id);

  if (error) {
    return { status: "error", message: error.message };
  }

  await recordActivity({
    entity_table: "players",
    entity_id: id,
    action: "update",
    diff: result as unknown as Record<string, unknown>,
  });

  revalidatePath("/players");
  revalidatePath("/players/jumpers");
  revalidatePath(`/players/${id}`);
  redirect(`/players/${id}`);
}

export async function deletePlayer(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await recordActivity({
    entity_table: "players",
    entity_id: id,
    action: "delete",
  });

  revalidatePath("/players");
  revalidatePath("/players/jumpers");
  redirect("/players");
}
