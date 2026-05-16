"use client";

import { useTransition, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { deleteVoucher } from "../../actions";

export function DeleteVoucherButton({
  voucherId,
  code,
  children,
}: {
  voucherId: string;
  code: string;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      onClick={() => {
        if (!window.confirm(`Delete voucher ${code}? This can't be undone.`)) return;
        startTransition(async () => {
          await deleteVoucher(voucherId);
        });
      }}
      disabled={pending}
      className="text-wfc-status-red hover:bg-wfc-status-red/10"
    >
      {children}
    </Button>
  );
}
