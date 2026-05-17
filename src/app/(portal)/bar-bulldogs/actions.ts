"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordActivity } from "@/lib/audit";
import { generateVoucherCode } from "@/lib/db/vouchers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const voucherSchema = z.object({
  member_id: z.string().uuid().nullable(),
  amount_aud: z.number().positive().max(10_000),
  issued_reason: z.string().trim().max(200).nullable(),
});

export type VoucherFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

function blankToNull(value: FormDataEntryValue | null): string | null {
  if (value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

export async function issueVoucher(
  _prev: VoucherFormState | undefined,
  formData: FormData,
): Promise<VoucherFormState> {
  const amountRaw = blankToNull(formData.get("amount_aud"));
  const amount = amountRaw === null ? NaN : Number(amountRaw);
  const parsed = voucherSchema.safeParse({
    member_id: blankToNull(formData.get("member_id")),
    amount_aud: amount,
    issued_reason: blankToNull(formData.get("issued_reason")),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();

  // Retry on the unlikely event of a code collision.
  let inserted: { id: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateVoucherCode();
    const payload = {
      ...parsed.data,
      amount_aud: parsed.data.amount_aud.toFixed(2),
      voucher_code: code,
    };
    const { data, error } = await supabase
      .from("bulldogs_dollars")
      .insert(payload as unknown as never)
      .select("id")
      .single();
    if (!error && data) {
      inserted = data as { id: string };
      break;
    }
    if (error?.code !== "23505") {
      return { status: "error", message: error?.message ?? "Could not issue voucher." };
    }
  }
  if (!inserted) {
    return { status: "error", message: "Could not generate a unique voucher code." };
  }

  await recordActivity({
    entity_table: "bulldogs_dollars",
    entity_id: inserted.id,
    action: "issue",
    diff: parsed.data as unknown as Record<string, unknown>,
  });

  revalidatePath("/bar-bulldogs");
  revalidatePath("/");
  redirect(`/bar-bulldogs/${inserted.id}`);
}

const redeemSchema = z.object({
  voucher_id: z.string().uuid(),
  point: z.enum(["bar", "canteen"]),
  redeemed_amount: z.number().nonnegative().max(10_000),
});

export async function redeemVoucher(
  voucherId: string,
  point: "bar" | "canteen",
  redeemedAmount: number,
): Promise<void> {
  const parsed = redeemSchema.safeParse({
    voucher_id: voucherId,
    point,
    redeemed_amount: redeemedAmount,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid redemption");
  }

  const supabase = await createSupabaseServerClient();
  const { data: voucher } = await supabase
    .from("bulldogs_dollars")
    .select("id, redeemed_at")
    .eq("id", voucherId)
    .maybeSingle();
  if (!voucher) throw new Error("Voucher not found");
  if ((voucher as { redeemed_at: string | null }).redeemed_at) {
    throw new Error("Voucher already redeemed");
  }

  const { error } = await supabase
    .from("bulldogs_dollars")
    .update({
      redeemed_at: new Date().toISOString(),
      redeemed_at_point: point,
      redeemed_amount: redeemedAmount.toFixed(2),
    } as never)
    .eq("id", voucherId);
  if (error) throw new Error(error.message);

  await recordActivity({
    entity_table: "bulldogs_dollars",
    entity_id: voucherId,
    action: "redeem",
    diff: { point, redeemed_amount: redeemedAmount },
  });

  revalidatePath("/bar-bulldogs");
  revalidatePath(`/bar-bulldogs/${voucherId}`);
  revalidatePath("/");
}

export async function deleteVoucher(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("bulldogs_dollars").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordActivity({
    entity_table: "bulldogs_dollars",
    entity_id: id,
    action: "delete",
  });
  revalidatePath("/bar-bulldogs");
  revalidatePath("/");
  redirect("/bar-bulldogs");
}
