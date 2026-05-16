import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MemberType, SponsorPackStatus } from "@/lib/db/types";

import type { SponsorTier } from "./sponsor-types";

export type { SponsorTier } from "./sponsor-types";
export {
  SPONSOR_TIERS,
  SPONSOR_TIER_LABEL,
  PACK_STATUS_OPTIONS,
  PACK_STATUS_LABEL,
  PACK_STATUS_PILL,
  currentSeason,
} from "./sponsor-types";

export type SponsorMember = {
  id: string;
  first_name: string;
  last_name: string;
  member_type: SponsorTier;
  email: string | null;
  phone: string | null;
  member_number: string | null;
  has_pack_this_season: boolean;
};

export async function listSponsors(season: number): Promise<SponsorMember[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("members")
      .select(
        "id, first_name, last_name, member_type, email, phone, member_number, sponsor_packs(id, season)",
      )
      .in("member_type", ["gold_sponsor", "silver_sponsor", "bronze_sponsor"])
      .order("member_type", { ascending: true })
      .order("last_name", { ascending: true });

    type Shape = Omit<SponsorMember, "has_pack_this_season"> & {
      sponsor_packs: Array<{ id: string; season: number }> | null;
    };
    const rows = (data ?? []) as unknown as Shape[];
    return rows.map((row) => ({
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      member_type: row.member_type,
      email: row.email,
      phone: row.phone,
      member_number: row.member_number,
      has_pack_this_season:
        row.sponsor_packs?.some((pack) => pack.season === season) ?? false,
    }));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[sponsors.list]", (err as Error).message);
    }
    return [];
  }
}

export type SponsorPackListRow = {
  id: string;
  member_id: string | null;
  season: number;
  pack_status: SponsorPackStatus;
  contents: Array<{ item: string; qty: number }>;
  scheduled_delivery: string | null;
  delivered_at: string | null;
  notes: string | null;
  sponsor_name: string;
  sponsor_tier: MemberType | null;
};

export type SponsorPackDetail = SponsorPackListRow & {
  delivered_by: string | null;
  signed_receipt_path: string | null;
  created_at: string;
  updated_at: string;
};

const PACK_LIST_SELECT =
  "id, member_id, season, pack_status, contents, scheduled_delivery, delivered_at, notes, " +
  "members(first_name, last_name, member_type)";

const PACK_DETAIL_SELECT =
  "id, member_id, season, pack_status, contents, scheduled_delivery, delivered_at, delivered_by, " +
  "signed_receipt_path, notes, created_at, updated_at, " +
  "members(first_name, last_name, member_type)";

type PackListShape = Omit<SponsorPackListRow, "sponsor_name" | "sponsor_tier"> & {
  members: { first_name: string; last_name: string; member_type: MemberType } | null;
};

type PackDetailShape = Omit<SponsorPackDetail, "sponsor_name" | "sponsor_tier"> & {
  members: { first_name: string; last_name: string; member_type: MemberType } | null;
};

export async function listSponsorPacks(season?: number): Promise<SponsorPackListRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("sponsor_packs")
      .select(PACK_LIST_SELECT)
      .order("scheduled_delivery", { ascending: true, nullsFirst: false });
    if (season !== undefined) query = query.eq("season", season);

    const { data } = await query;
    const rows = (data ?? []) as unknown as PackListShape[];
    return rows.map((row) => ({
      ...row,
      contents: Array.isArray(row.contents) ? row.contents : [],
      sponsor_name: row.members
        ? `${row.members.first_name} ${row.members.last_name}`
        : "(sponsor missing)",
      sponsor_tier: row.members?.member_type ?? null,
    }));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[sponsors.packs.list]", (err as Error).message);
    }
    return [];
  }
}

export async function getSponsorPack(id: string): Promise<SponsorPackDetail | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("sponsor_packs")
      .select(PACK_DETAIL_SELECT)
      .eq("id", id)
      .maybeSingle();
    const row = data as unknown as PackDetailShape | null;
    if (!row) return null;
    return {
      ...row,
      contents: Array.isArray(row.contents) ? row.contents : [],
      sponsor_name: row.members
        ? `${row.members.first_name} ${row.members.last_name}`
        : "(sponsor missing)",
      sponsor_tier: row.members?.member_type ?? null,
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[sponsors.packs.get]", (err as Error).message);
    }
    return null;
  }
}

export type SponsorPick = {
  id: string;
  first_name: string;
  last_name: string;
  member_type: SponsorTier;
};

export async function listSponsorPicker(): Promise<SponsorPick[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("members")
      .select("id, first_name, last_name, member_type")
      .in("member_type", ["gold_sponsor", "silver_sponsor", "bronze_sponsor"])
      .order("member_type", { ascending: true })
      .order("last_name", { ascending: true });
    return (data ?? []) as unknown as SponsorPick[];
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[sponsors.picker]", (err as Error).message);
    }
    return [];
  }
}

