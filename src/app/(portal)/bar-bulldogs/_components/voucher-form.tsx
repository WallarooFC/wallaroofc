"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { MemberPick } from "@/lib/db/vouchers";

import { issueVoucher, type VoucherFormState } from "../actions";

const INITIAL: VoucherFormState = { status: "idle" };

export function VoucherForm({ members }: { members: MemberPick[] }) {
  const [state, formAction, pending] = useActionState(issueVoucher, INITIAL);
  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <section className="rounded-lg border border-wfc-line bg-white p-5">
        <h3 className="mb-4 font-serif text-base font-semibold text-wfc-blue-deep">
          Voucher
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="member_id">Recipient</Label>
            <Select name="member_id" defaultValue="">
              <option value="">— Unlinked (gift voucher) —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.last_name}, {m.first_name}
                  {m.member_number ? ` · ${m.member_number}` : ""}
                </option>
              ))}
            </Select>
            {fieldErrors.member_id ? (
              <p role="alert" className="mt-1 text-[11px] text-wfc-status-red">
                {fieldErrors.member_id}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="amount_aud">Amount (AUD)</Label>
            <Input
              name="amount_aud"
              type="number"
              inputMode="decimal"
              step="0.50"
              min="0.50"
              max="10000"
              required
              placeholder="40.00"
            />
            {fieldErrors.amount_aud ? (
              <p role="alert" className="mt-1 text-[11px] text-wfc-status-red">
                {fieldErrors.amount_aud}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="issued_reason">Reason</Label>
            <Input
              name="issued_reason"
              placeholder="Gold sponsor pack · meal voucher × 1"
            />
            {fieldErrors.issued_reason ? (
              <p role="alert" className="mt-1 text-[11px] text-wfc-status-red">
                {fieldErrors.issued_reason}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-wfc-line pt-4">
        {state.status === "error" ? (
          <p role="alert" className="mr-auto text-sm text-wfc-status-red">
            {state.message}
          </p>
        ) : null}
        <Link
          href="/bar-bulldogs"
          className="font-mono text-xs uppercase tracking-[0.16em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending} size="lg">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Issuing…
            </>
          ) : (
            "Issue voucher"
          )}
        </Button>
      </div>
    </form>
  );
}
