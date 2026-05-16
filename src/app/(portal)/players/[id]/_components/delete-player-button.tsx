"use client";

import { useTransition, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { deletePlayer } from "../../actions";

export function DeletePlayerButton({
  playerId,
  playerName,
  children,
}: {
  playerId: string;
  playerName: string;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      onClick={() => {
        const ok = window.confirm(
          `Delete ${playerName}? The player record is removed; the linked member row stays in place.`,
        );
        if (!ok) return;
        startTransition(async () => {
          await deletePlayer(playerId);
        });
      }}
      disabled={pending}
      className="text-wfc-status-red hover:bg-wfc-status-red/10"
    >
      {children}
    </Button>
  );
}
