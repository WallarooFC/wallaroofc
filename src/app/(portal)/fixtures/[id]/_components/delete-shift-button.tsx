"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useTransition } from "react";

import { deleteShift } from "../../actions";

export function DeleteShiftButton({
  fixtureId,
  shiftId,
  shiftLabel,
}: {
  fixtureId: string;
  shiftId: string;
  shiftLabel: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey hover:bg-wfc-status-red/10 hover:text-wfc-status-red"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Delete the "${shiftLabel}" shift and all its assignments?`)) {
          return;
        }
        startTransition(async () => {
          await deleteShift(fixtureId, shiftId);
        });
      }}
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <Trash2 className="h-3 w-3" aria-hidden />}
      Delete shift
    </button>
  );
}
