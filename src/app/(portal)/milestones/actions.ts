"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordActivity } from "@/lib/audit";
import { GAME_THRESHOLDS } from "@/lib/db/milestone-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

const milestoneTypeSchema = z.enum([
  "50_games",
  "100_games",
  "150_games",
  "200_games",
  "250_games",
  "300_games",
  "life_member",
  "other",
]);

const statusSchema = z.enum(["upcoming", "imminent", "completed", "passed"]);

const milestoneSchema = z.object({
  player_id: z.string().uuid().nullable(),
  milestone_type: milestoneTypeSchema.nullable(),
  target_game_count: z.number().int().min(1).max(1000).nullable(),
  projected_fixture_id: z.string().uuid().nullable(),
  status: statusSchema,
  jumper_ordered: z.boolean(),
  presentation_planned: z.boolean(),
  media_release_sent: z.boolean(),
  notes: z.string().trim().max(2000).nullable(),
});

type MilestoneWrite = z.infer<typeof milestoneSchema>;

export type MilestoneFormState =
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

function parseForm(formData: FormData): MilestoneWrite | { error: MilestoneFormState } {
  const parsed = milestoneSchema.safeParse({
    player_id: blankToNull(formData.get("player_id")),
    milestone_type: blankToNull(formData.get("milestone_type")),
    target_game_count: intOrNull(formData.get("target_game_count")),
    projected_fixture_id: blankToNull(formData.get("projected_fixture_id")),
    status: blankToNull(formData.get("status")) ?? "upcoming",
    jumper_ordered: checkbox(formData.get("jumper_ordered")),
    presentation_planned: checkbox(formData.get("presentation_planned")),
    media_release_sent: checkbox(formData.get("media_release_sent")),
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

export async function createMilestone(
  _prev: MilestoneFormState | undefined,
  formData: FormData,
): Promise<MilestoneFormState> {
  const result = parseForm(formData);
  if ("error" in result) return result.error;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("milestones")
    .insert(result as unknown as never)
    .select("id")
    .single();
  if (error || !data) {
    return { status: "error", message: error?.message ?? "Could not create milestone." };
  }
  const id = (data as { id: string }).id;
  await recordActivity({
    entity_table: "milestones",
    entity_id: id,
    action: "create",
    diff: result as unknown as Record<string, unknown>,
  });
  revalidatePath("/milestones");
  revalidatePath("/");
  redirect(`/milestones/${id}`);
}

export async function updateMilestone(
  id: string,
  _prev: MilestoneFormState | undefined,
  formData: FormData,
): Promise<MilestoneFormState> {
  const result = parseForm(formData);
  if ("error" in result) return result.error;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("milestones")
    .update(result as unknown as never)
    .eq("id", id);
  if (error) {
    return { status: "error", message: error.message };
  }
  await recordActivity({
    entity_table: "milestones",
    entity_id: id,
    action: "update",
    diff: result as unknown as Record<string, unknown>,
  });
  revalidatePath("/milestones");
  revalidatePath(`/milestones/${id}`);
  revalidatePath("/");
  redirect(`/milestones/${id}`);
}

export async function deleteMilestone(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("milestones").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordActivity({ entity_table: "milestones", entity_id: id, action: "delete" });
  revalidatePath("/milestones");
  revalidatePath("/");
  redirect("/milestones");
}

export async function toggleMilestoneFlag(
  id: string,
  field: "jumper_ordered" | "presentation_planned" | "media_release_sent",
  next: boolean,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("milestones")
    .update({ [field]: next } as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
  await recordActivity({
    entity_table: "milestones",
    entity_id: id,
    action: "update",
    diff: { [field]: next },
  });
  revalidatePath(`/milestones/${id}`);
  revalidatePath("/milestones");
  revalidatePath("/");
}

/**
 * Scan players + existing milestones; create a row for every senior-game
 * threshold the player is within 10 games of (and doesn't already have).
 *
 * Service-role client so the insert bypasses the per-table RLS policies.
 * Idempotent on (player_id, target_game_count).
 */
export async function syncMilestonesFromPlayers(): Promise<{
  created: number;
  scanned: number;
}> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: playersData } = await supabase
    .from("players")
    .select("id, games_played_seniors");
  const players = (playersData ?? []) as unknown as Array<{
    id: string;
    games_played_seniors: number;
  }>;

  const { data: existingData } = await supabase
    .from("milestones")
    .select("player_id, target_game_count");
  const existing = new Set<string>();
  for (const row of (existingData ?? []) as unknown as Array<{
    player_id: string | null;
    target_game_count: number | null;
  }>) {
    if (row.player_id && row.target_game_count !== null) {
      existing.add(`${row.player_id}:${row.target_game_count}`);
    }
  }

  let created = 0;
  for (const player of players) {
    for (const threshold of GAME_THRESHOLDS) {
      const remaining = threshold.target - player.games_played_seniors;
      if (remaining < -3 || remaining > 10) continue;
      const key = `${player.id}:${threshold.target}`;
      if (existing.has(key)) continue;

      const status =
        remaining <= 0 ? "passed" : remaining <= 3 ? "imminent" : "upcoming";

      const { error } = await supabase.from("milestones").insert({
        player_id: player.id,
        milestone_type: threshold.type,
        target_game_count: threshold.target,
        status,
      } as never);
      if (!error) {
        created += 1;
        existing.add(key);
      }
    }
  }

  revalidatePath("/milestones");
  revalidatePath("/");
  return { created, scanned: players.length };
}

export async function runMilestoneSync(): Promise<void> {
  await syncMilestonesFromPlayers();
}
