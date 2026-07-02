import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { templateBodySchema, type Template, type TemplateCategory } from "./types";

type TemplateRow = {
  id: string;
  title: string;
  category: TemplateCategory;
  body: unknown;
  image_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function rowToTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    body: templateBodySchema.parse(row.body),
    imagePath: row.image_path,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listTemplates(options?: {
  category?: TemplateCategory;
}): Promise<Template[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("templates")
    .select("id, title, category, body, image_path, created_by, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => rowToTemplate(row as TemplateRow));
}

export async function getTemplateById(id: string): Promise<Template | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("templates")
    .select("id, title, category, body, image_path, created_by, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return rowToTemplate(data as TemplateRow);
}
