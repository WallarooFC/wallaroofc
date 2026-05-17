"use client";

import { useTransition, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { deleteSponsorPack } from "../../actions";

export function DeletePackButton({
  packId,
  sponsorName,
  children,
}: {
  packId: string;
  sponsorName: string;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      onClick={() => {
        const ok = window.confirm(`Delete ${sponsorName}'s pack? This can't be undone.`);
        if (!ok) return;
        startTransition(async () => {
          await deleteSponsorPack(packId);
        });
      }}
      disabled={pending}
      className="text-wfc-status-red hover:bg-wfc-status-red/10"
    >
      {children}
    </Button>
  );
}
