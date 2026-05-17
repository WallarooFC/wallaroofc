"use client";

import { useTransition, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { deleteCompliance } from "../../actions";

export function DeleteComplianceButton({
  recordId,
  children,
}: {
  recordId: string;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      onClick={() => {
        const ok = window.confirm(
          "Delete this compliance record? The renewal reminder schedule will stop firing for it.",
        );
        if (!ok) return;
        startTransition(async () => {
          await deleteCompliance(recordId);
        });
      }}
      disabled={pending}
      className="text-wfc-status-red hover:bg-wfc-status-red/10"
    >
      {children}
    </Button>
  );
}
