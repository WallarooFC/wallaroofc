import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CertType, ComplianceRow } from "@/lib/db/types";

export type ComplianceListRow = {
  id: string;
  member_id: string | null;
  cert_type: CertType;
  cert_number: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  member_name: string;
  member_number: string | null;
  member_email: string | null;
};

export type ComplianceDetail = ComplianceRow & {
  member_name: string | null;
  member_number: string | null;
  member_email: string | null;
};

const LIST_SELECT =
  "id, member_id, cert_type, cert_number, issued_date, expiry_date, notes, " +
  "members(first_name, last_name, member_number, email)";

const DETAIL_SELECT =
  "id, member_id, cert_type, cert_number, issued_date, expiry_date, evidence_file_path, " +
  "notes, last_reminder_sent_at, created_at, updated_at, " +
  "members(first_name, last_name, member_number, email)";

type ListShape = Omit<ComplianceListRow, "member_name" | "member_number" | "member_email"> & {
  members: { first_name: string; last_name: string; member_number: string | null; email: string | null } | null;
};

type DetailShape = ComplianceRow & {
  members: { first_name: string; last_name: string; member_number: string | null; email: string | null } | null;
};

export async function listCompliance(): Promise<ComplianceListRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("compliance_records")
      .select(LIST_SELECT)
      .order("expiry_date", { ascending: true, nullsFirst: false });

    const rows = (data ?? []) as unknown as ListShape[];
    return rows.map((row) => ({
      ...row,
      member_name: row.members
        ? `${row.members.first_name} ${row.members.last_name}`
        : "(unlinked)",
      member_number: row.members?.member_number ?? null,
      member_email: row.members?.email ?? null,
    }));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[compliance.list]", (err as Error).message);
    }
    return [];
  }
}

export async function getCompliance(id: string): Promise<ComplianceDetail | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("compliance_records")
      .select(DETAIL_SELECT)
      .eq("id", id)
      .maybeSingle();
    const row = data as unknown as DetailShape | null;
    if (!row) return null;
    return {
      ...row,
      member_name: row.members ? `${row.members.first_name} ${row.members.last_name}` : null,
      member_number: row.members?.member_number ?? null,
      member_email: row.members?.email ?? null,
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[compliance.get]", (err as Error).message);
    }
    return null;
  }
}

export type MemberPick = {
  id: string;
  first_name: string;
  last_name: string;
  member_number: string | null;
  email: string | null;
};

export async function listMembersForPicker(): Promise<MemberPick[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("members")
      .select("id, first_name, last_name, member_number, email")
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true });
    return (data ?? []) as unknown as MemberPick[];
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[compliance.pickerMembers]", (err as Error).message);
    }
    return [];
  }
}

export function daysToExpiry(expiry: string | null): number | null {
  if (!expiry) return null;
  const days = Math.round(
    (new Date(expiry).getTime() - Date.now()) / 86400_000,
  );
  return days;
}
