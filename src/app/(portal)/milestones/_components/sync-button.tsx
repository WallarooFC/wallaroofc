"use client";

import { useTransition, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { runMilestoneSync } from "../actions";

export function SyncMilestonesButton({ children }: { children: ReactNode }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      size="lg"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await runMilestoneSync();
        });
      }}
    >
      {children}
    </Button>
  );
}
