import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import type { BulldogsDollarsRow } from "@/lib/db/types";

export type VoucherListRow = {
  id: string;
  voucher_code: string;
  amount_aud: string;
  issued_reason: string | null;
  issued_at: string;
  redeemed_at: string | null;
  redeemed_at_point: "bar" | "canteen" | null;
  redeemed_amount: string | null;
  member_id: string | null;
  member_name: string;
};

export type VoucherDetail = BulldogsDollarsRow & {
  member_name: string;
};

const LIST_SELECT =
  "id, voucher_code, amount_aud, issued_reason, issued_at, redeemed_at, redeemed_at_point, " +
  "redeemed_amount, member_id, members(first_name, last_name)";

const DETAIL_SELECT =
  "id, voucher_code, amount_aud, issued_reason, issued_at, redeemed_at, redeemed_at_point, " +
  "redeemed_amount, member_id, created_at, updated_at, members(first_name, last_name)";

type ListShape = Omit<VoucherListRow, "member_name"> & {
  members: { first_name: string; last_name: string } | null;
};

type DetailShape = BulldogsDollarsRow & {
  members: { first_name: string; last_name: string } | null;
};

export async function listVouchers(): Promise<VoucherListRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("bulldogs_dollars")
      .select(LIST_SELECT)
      .order("issued_at", { ascending: false });
    const rows = (data ?? []) as unknown as ListShape[];
    return rows.map((row) => ({
      ...row,
      member_name: row.members
        ? `${row.members.first_name} ${row.members.last_name}`
        : "(unlinked)",
    }));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[vouchers.list]", (err as Error).message);
    }
    return [];
  }
}

export async function getVoucher(id: string): Promise<VoucherDetail | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("bulldogs_dollars")
      .select(DETAIL_SELECT)
      .eq("id", id)
      .maybeSingle();
    const row = data as unknown as DetailShape | null;
    if (!row) return null;
    return {
      ...row,
      member_name: row.members
        ? `${row.members.first_name} ${row.members.last_name}`
        : "(unlinked)",
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[vouchers.get]", (err as Error).message);
    }
    return null;
  }
}

/**
 * Looks up by voucher_code rather than UUID. Used by the redemption page
 * which is reached via a QR scan and only knows the human code.
 *
 * Uses the service-role client so unauthenticated webhook handlers in a
 * future v2 can hit the same code path; the (portal) middleware still
 * gates the UI page.
 */
export async function getVoucherByCode(code: string): Promise<VoucherDetail | null> {
  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data } = await supabase
      .from("bulldogs_dollars")
      .select(DETAIL_SELECT)
      .eq("voucher_code", code)
      .maybeSingle();
    const row = data as unknown as DetailShape | null;
    if (!row) return null;
    return {
      ...row,
      member_name: row.members
        ? `${row.members.first_name} ${row.members.last_name}`
        : "(unlinked)",
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[vouchers.byCode]", (err as Error).message);
    }
    return null;
  }
}

export async function getVoucherTotals(): Promise<{
  issued: number;
  redeemed: number;
  outstanding: number;
  active: number;
  redeemedCount: number;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("bulldogs_dollars")
      .select("amount_aud, redeemed_amount, redeemed_at");
    type Row = {
      amount_aud: string | null;
      redeemed_amount: string | null;
      redeemed_at: string | null;
    };
    const rows = (data ?? []) as unknown as Row[];
    let issued = 0;
    let redeemed = 0;
    let active = 0;
    let redeemedCount = 0;
    for (const row of rows) {
      const a = Number(row.amount_aud ?? 0);
      issued += a;
      if (row.redeemed_at) {
        const r = Number(row.redeemed_amount ?? row.amount_aud ?? 0);
        redeemed += r;
        redeemedCount += 1;
      } else {
        active += 1;
      }
    }
    return { issued, redeemed, outstanding: issued - redeemed, active, redeemedCount };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[vouchers.totals]", (err as Error).message);
    }
    return { issued: 0, redeemed: 0, outstanding: 0, active: 0, redeemedCount: 0 };
  }
}

export type MemberPick = {
  id: string;
  first_name: string;
  last_name: string;
  member_number: string | null;
};

export async function listMembersForVoucher(): Promise<MemberPick[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("members")
      .select("id, first_name, last_name, member_number")
      .order("last_name", { ascending: true });
    return (data ?? []) as unknown as MemberPick[];
  } catch {
    return [];
  }
}

/**
 * Crockford-style base32 (no I/L/O/U to avoid lookalikes). 8 chars gives
 * 32^8 = ~10^12 possible codes; collision risk is negligible for the
 * club's volumes.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";

export function generateVoucherCode(): string {
  let out = "";
  for (let i = 0; i < 8; i += 1) {
    const idx = Math.floor(Math.random() * ALPHABET.length);
    out += ALPHABET[idx];
  }
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}
