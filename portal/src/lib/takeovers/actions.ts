"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { scheduleTakeoverSchema, windowsOverlap, type ScheduleTakeoverInput } from "./types";

export type TakeoverFormState = { error?: string };

async function requireUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function scheduleTakeover(
  raw: ScheduleTakeoverInput,
): Promise<TakeoverFormState | { id: string }> {
  const parsed = scheduleTakeoverSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid schedule." };
  }
  const { supabase, userId } = await requireUserId();

  // Client-side overlap check on top of the DB trigger (belt-and-braces).
  const { data: existing, error: existingError } = await supabase
    .from("landing_takeovers")
    .select("id, starts_at, ends_at, is_paused");
  if (existingError) return { error: existingError.message };

  const clash = (existing ?? []).some(
    (row) =>
      !row.is_paused &&
      windowsOverlap(
        { startsAt: row.starts_at as string, endsAt: row.ends_at as string },
        parsed.data,
      ),
  );
  if (clash) {
    return {
      error:
        "That window overlaps an existing active takeover. Pick a different time or pause the other one first.",
    };
  }

  const { data, error } = await supabase
    .from("landing_takeovers")
    .insert({
      template_id: parsed.data.templateId,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/takeovers");
  return { id: data.id as string };
}

export async function pauseTakeover(id: string): Promise<TakeoverFormState | void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase
    .from("landing_takeovers")
    .update({ is_paused: true })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/takeovers");
}

export async function resumeTakeover(id: string): Promise<TakeoverFormState | void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase
    .from("landing_takeovers")
    .update({ is_paused: false })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/takeovers");
}

export async function cancelTakeover(id: string): Promise<TakeoverFormState | void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("landing_takeovers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/takeovers");
  redirect("/takeovers");
}
