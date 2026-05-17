"use client";

import { useTransition, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { deleteMember } from "../../actions";

export function DeleteMemberButton({
  memberId,
  memberName,
  children,
}: {
  memberId: string;
  memberName: string;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      onClick={() => {
        const confirmed = window.confirm(
          `Delete ${memberName}? This is permanent — they'll be removed from the register and any linked player rows.`,
        );
        if (!confirmed) return;
        startTransition(async () => {
          await deleteMember(memberId);
        });
      }}
      disabled={pending}
      className="text-wfc-status-red hover:bg-wfc-status-red/10"
    >
      {children}
    </Button>
  );
}
