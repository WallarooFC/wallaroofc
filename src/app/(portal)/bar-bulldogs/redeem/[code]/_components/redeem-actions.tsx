"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redeemVoucher } from "../../../actions";

export function RedeemActions({
  voucherId,
  amount,
}: {
  voucherId: string;
  amount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState<number>(amount);

  function go(point: "bar" | "canteen") {
    setError(null);
    startTransition(async () => {
      try {
        await redeemVoucher(voucherId, point, redeemed);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <section className="rounded-lg border border-wfc-line bg-white p-5">
      <div className="mb-4">
        <Label htmlFor="redeemed_amount">Amount redeemed (AUD)</Label>
        <Input
          name="redeemed_amount"
          type="number"
          inputMode="decimal"
          step="0.50"
          min="0"
          max="10000"
          value={redeemed}
          onChange={(e) => setRedeemed(Number(e.target.value))}
        />
        <p className="mt-1 text-[11px] text-wfc-grey">
          Defaults to the issued amount. Override if only part of the voucher was used.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          size="lg"
          disabled={pending}
          onClick={() => go("bar")}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          Redeem at bar
        </Button>
        <Button
          variant="secondary"
          size="lg"
          disabled={pending}
          onClick={() => go("canteen")}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          Redeem at canteen
        </Button>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-wfc-status-red">
          {error}
        </p>
      ) : null}
    </section>
  );
}
