"use client";

import { Loader2, X } from "lucide-react";
import { useTransition } from "react";

import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { RosterStatus } from "@/lib/db/types";

import { removeAssignment, setAssignmentStatus } from "../../actions";

const STATUS_OPTIONS: ReadonlyArray<{ value: RosterStatus; label: string }> = [
  { value: "invited", label: "Invited" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
  { value: "no_response", label: "No response" },
];

const STATUS_DOT: Record<RosterStatus, string> = {
  invited: "bg-wfc-status-amber",
  confirmed: "bg-wfc-status-green",
  declined: "bg-wfc-status-red",
  no_response: "bg-wfc-grey",
};

export function AssignmentRow({
  fixtureId,
  assignmentId,
  memberName,
  status,
}: {
  fixtureId: string;
  assignmentId: string;
  memberName: string;
  status: RosterStatus;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-3 border-b border-wfc-line/60 py-2 last:border-b-0">
      <span
        className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT[status])}
        aria-hidden
      />
      <span className="flex-1 text-sm text-wfc-blue-deep">{memberName}</span>
      <Select
        className="h-8 w-36 text-xs"
        defaultValue={status}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as RosterStatus;
          startTransition(async () => {
            await setAssignmentStatus(fixtureId, assignmentId, next);
          });
        }}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      <button
        type="button"
        className="rounded-md p-1.5 text-wfc-grey hover:bg-wfc-status-red/10 hover:text-wfc-status-red"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Remove ${memberName} from this shift?`)) return;
          startTransition(async () => {
            await removeAssignment(fixtureId, assignmentId);
          });
        }}
        aria-label={`Remove ${memberName}`}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
      </button>
    </li>
  );
}
