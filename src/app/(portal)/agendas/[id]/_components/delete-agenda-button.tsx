"use client";

import { useTransition, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { deleteAgenda } from "../../actions";

export function DeleteAgendaButton({
  agendaId,
  children,
}: {
  agendaId: string;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      onClick={() => {
        if (!window.confirm("Delete this agenda? Action items cascade with it.")) return;
        startTransition(async () => {
          await deleteAgenda(agendaId);
        });
      }}
      disabled={pending}
      className="text-wfc-status-red hover:bg-wfc-status-red/10"
    >
      {children}
    </Button>
  );
}
