import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MemberType } from "@/lib/db/types";

import type { Segment } from "./comms-types";

export type { Segment } from "./comms-types";
export { SEGMENT_OPTIONS } from "./comms-types";

export type Recipient = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  member_type: MemberType;
};

function matchesSegment(row: Recipient, segment: Segment): boolean {
  switch (segment) {
    case "all":
      return true;
    case "all_with_email":
      return !!row.email;
    case "life":
      return row.member_type === "life";
    case "playing":
      return row.member_type === "senior" || row.member_type === "junior";
    case "sponsors":
      return (
        row.member_type === "gold_sponsor" ||
        row.member_type === "silver_sponsor" ||
        row.member_type === "bronze_sponsor"
      );
    case "gold_sponsors":
      return row.member_type === "gold_sponsor";
    case "vip":
      return row.member_type === "vip";
    case "paid_2026":
    case "unpaid_2026":
      // handled via the paid_current_season column below; matchesSegment only
      // sees the member_type slice.
      return true;
    default:
      return false;
  }
}

export async function listSegmentRecipients(segment: Segment): Promise<Recipient[]> {
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("members")
      .select("id, first_name, last_name, email, member_type, paid_current_season");

    if (segment === "paid_2026") query = query.eq("paid_current_season", true);
    if (segment === "unpaid_2026") query = query.eq("paid_current_season", false);

    const { data } = await query;
    type Row = Recipient & { paid_current_season: boolean };
    const rows = (data ?? []) as unknown as Row[];

    return rows.filter((row) => matchesSegment(row, segment));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[comms.recipients]", (err as Error).message);
    }
    return [];
  }
}

export type SegmentSizes = Record<Segment, { total: number; withEmail: number }>;

export async function getSegmentSizes(): Promise<SegmentSizes> {
  const base: SegmentSizes = {
    all: { total: 0, withEmail: 0 },
    all_with_email: { total: 0, withEmail: 0 },
    life: { total: 0, withEmail: 0 },
    playing: { total: 0, withEmail: 0 },
    sponsors: { total: 0, withEmail: 0 },
    gold_sponsors: { total: 0, withEmail: 0 },
    paid_2026: { total: 0, withEmail: 0 },
    unpaid_2026: { total: 0, withEmail: 0 },
    vip: { total: 0, withEmail: 0 },
  };
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("members")
      .select("email, member_type, paid_current_season");
    type Row = {
      email: string | null;
      member_type: MemberType;
      paid_current_season: boolean;
    };
    const rows = (data ?? []) as unknown as Row[];

    for (const row of rows) {
      const slim: Recipient = {
        id: "",
        first_name: "",
        last_name: "",
        email: row.email,
        member_type: row.member_type,
      };
      const hasEmail = !!row.email;
      for (const seg of Object.keys(base) as Segment[]) {
        if (seg === "paid_2026") {
          if (!row.paid_current_season) continue;
        } else if (seg === "unpaid_2026") {
          if (row.paid_current_season) continue;
        } else if (!matchesSegment(slim, seg)) {
          continue;
        }
        base[seg].total += 1;
        if (hasEmail) base[seg].withEmail += 1;
      }
    }
    return base;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[comms.sizes]", (err as Error).message);
    }
    return base;
  }
}

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/gu, (match, key: string) => {
    return vars[key] ?? match;
  });
}
