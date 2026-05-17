"use client";

import { useTransition, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { deleteGateTakings } from "../../actions";

export function DeleteGateTakingsButton({
  entryId,
  children,
}: {
  entryId: string;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      onClick={() => {
        if (!window.confirm("Delete these takings? This can't be undone.")) return;
        startTransition(async () => {
          await deleteGateTakings(entryId);
        });
      }}
      disabled={pending}
      className="text-wfc-status-red hover:bg-wfc-status-red/10"
    >
      {children}
    </Button>
  );
}
