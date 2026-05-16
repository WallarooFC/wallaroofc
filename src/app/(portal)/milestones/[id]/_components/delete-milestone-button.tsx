"use client";

import { useTransition, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { deleteMilestone } from "../../actions";

export function DeleteMilestoneButton({
  milestoneId,
  children,
}: {
  milestoneId: string;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      onClick={() => {
        if (!window.confirm("Delete this milestone?")) return;
        startTransition(async () => {
          await deleteMilestone(milestoneId);
        });
      }}
      disabled={pending}
      className="text-wfc-status-red hover:bg-wfc-status-red/10"
    >
      {children}
    </Button>
  );
}
