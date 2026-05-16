import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MemberRow } from "@/lib/db/types";

/**
 * Loose row shape returned by select-list strings -- supabase-js's parser
 * narrows to `never` against our hand-written Database type, so we cast.
 */
export type MemberListRow = Pick<
  MemberRow,
  | "id"
  | "member_number"
  | "member_type"
  | "first_name"
  | "last_name"
  | "email"
  | "phone"
  | "paid_current_season"
  | "joined_year"
  | "prefers_post"
  | "prefers_email"
>;

const LIST_COLUMNS =
  "id, member_number, member_type, first_name, last_name, email, phone, paid_current_season, joined_year, prefers_post, prefers_email";

const DETAIL_COLUMNS =
  "id, member_number, member_type, first_name, last_name, email, phone, postal_address, prefers_post, prefers_email, joined_year, paid_current_season, notes, playhq_participant_id, created_at, updated_at";

export async function listMembers(): Promise<MemberListRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("members")
      .select(LIST_COLUMNS)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true });
    return (data ?? []) as unknown as MemberListRow[];
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[members.list]", (err as Error).message);
    }
    return [];
  }
}

export async function getMember(id: string): Promise<MemberRow | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("members")
      .select(DETAIL_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    return (data ?? null) as unknown as MemberRow | null;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[members.get]", (err as Error).message);
    }
    return null;
  }
}

