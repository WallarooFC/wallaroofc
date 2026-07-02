"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  createTemplateSchema,
  updateTemplateSchema,
  type CreateTemplateInput,
  type TemplateCategory,
} from "./types";

export type TemplateFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"title" | "body" | "category" | "form", string>>;
};

async function requireUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function createTemplate(
  raw: CreateTemplateInput,
): Promise<{ id: string } | TemplateFormState> {
  const parsed = createTemplateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? "Invalid template.",
    };
  }

  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("templates")
    .insert({
      title: parsed.data.title,
      category: parsed.data.category,
      body: parsed.data.body,
      image_path: parsed.data.imagePath,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/templates");
  return { id: data.id as string };
}

export async function updateTemplate(input: {
  id: string;
  patch: Partial<CreateTemplateInput>;
}): Promise<TemplateFormState | { ok: true }> {
  const parsed = updateTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid update." };
  }

  const { supabase } = await requireUserId();
  const patch = parsed.data.patch;
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.category !== undefined) dbPatch.category = patch.category;
  if (patch.body !== undefined) dbPatch.body = patch.body;
  if (patch.imagePath !== undefined) dbPatch.image_path = patch.imagePath;

  const { error } = await supabase.from("templates").update(dbPatch).eq("id", parsed.data.id);
  if (error) return { error: error.message };

  revalidatePath("/templates");
  revalidatePath(`/templates/${parsed.data.id}`);
  return { ok: true };
}

export async function deleteTemplate(id: string): Promise<TemplateFormState | void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("templates").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/templates");
  redirect("/templates");
}

export async function createTemplateAndRedirect(
  raw: CreateTemplateInput,
  redirectTo: (id: string) => `/${string}` = (id) => `/templates/${id}`,
): Promise<TemplateFormState> {
  const result = await createTemplate(raw);
  if ("error" in result && result.error) return result;
  if ("id" in result) redirect(redirectTo(result.id));
  return { error: "Unknown response from createTemplate." };
}

export type { TemplateCategory };
