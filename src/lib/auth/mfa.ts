import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type MfaStatus =
  | { state: "missing"; factorId: null }
  | { state: "pending_verification"; factorId: string }
  | { state: "verified"; factorId: string };

/**
 * Inspect a user's TOTP factors to decide whether to send them to /mfa/enrol
 * (no factor yet), continue an in-progress enrolment, or let them into the
 * portal. `listFactors().data.totp` only contains verified factors, so the
 * unverified case is detected via `data.all`.
 */
export async function getMfaStatus(supabase: SupabaseClient): Promise<MfaStatus> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data) {
    return { state: "missing", factorId: null };
  }

  const verifiedTotp = data.totp[0];
  if (verifiedTotp) {
    return { state: "verified", factorId: verifiedTotp.id };
  }

  const pending = data.all.find(
    (factor) => factor.factor_type === "totp" && factor.status === "unverified",
  );
  if (pending) {
    return { state: "pending_verification", factorId: pending.id };
  }

  return { state: "missing", factorId: null };
}
