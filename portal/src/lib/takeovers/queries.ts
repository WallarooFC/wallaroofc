import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { templateBodySchema, type Template } from "@/lib/templates/types";

import type { LandingTakeover, LandingTakeoverWithTemplate } from "./types";

type TakeoverRow = {
  id: string;
  template_id: string;
  starts_at: string;
  ends_at: string;
  is_paused: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type TemplateRow = {
  id: string;
  title: string;
  category: Template["category"];
  body: unknown;
  image_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function rowToTakeover(row: TakeoverRow): LandingTakeover {
  return {
    id: row.id,
    templateId: row.template_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isPaused: row.is_paused,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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

export async function listTakeovers(): Promise<LandingTakeoverWithTemplate[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("landing_takeovers")
    .select(
      "id, template_id, starts_at, ends_at, is_paused, created_by, created_at, updated_at, template:templates(id, title, category, body, image_path, created_by, created_at, updated_at)",
    )
    .order("starts_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const takeover = rowToTakeover(row as unknown as TakeoverRow);
    const template = rowToTemplate((row as unknown as { template: TemplateRow }).template);
    return { ...takeover, template };
  });
}

/**
 * Public: used by the widget API. Uses the service-role client because the
 * public site is unauthenticated. RLS still applies elsewhere.
 */
export async function getActiveTakeoverForPublic(): Promise<LandingTakeoverWithTemplate | null> {
  const supabase = createSupabaseServiceRoleClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("landing_takeovers")
    .select(
      "id, template_id, starts_at, ends_at, is_paused, created_by, created_at, updated_at, template:templates(id, title, category, body, image_path, created_by, created_at, updated_at)",
    )
    .eq("is_paused", false)
    .lte("starts_at", nowIso)
    .gt("ends_at", nowIso)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const takeover = rowToTakeover(data as unknown as TakeoverRow);
  const template = rowToTemplate((data as unknown as { template: TemplateRow }).template);
  return { ...takeover, template };
}
