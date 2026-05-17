"use client";

import { useTransition, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { deleteFixture } from "../../actions";

export function DeleteFixtureButton({
  fixtureId,
  fixtureLabel,
  children,
}: {
  fixtureId: string;
  fixtureLabel: string;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      onClick={() => {
        const ok = window.confirm(
          `Delete ${fixtureLabel}? Shifts and assignments cascade with it.`,
        );
        if (!ok) return;
        startTransition(async () => {
          await deleteFixture(fixtureId);
        });
      }}
      disabled={pending}
      className="text-wfc-status-red hover:bg-wfc-status-red/10"
    >
      {children}
    </Button>
  );
}
