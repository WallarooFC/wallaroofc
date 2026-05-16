"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";

import { toggleMilestoneFlag } from "../../actions";

export function FlagToggle({
  milestoneId,
  field,
  checked,
  label,
  description,
}: {
  milestoneId: string;
  field: "jumper_ordered" | "presentation_planned" | "media_release_sent";
  checked: boolean;
  label: string;
  description: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-wfc-line bg-white p-3 text-sm hover:border-wfc-blue/40">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-wfc-line text-wfc-red focus:ring-wfc-red"
        checked={checked}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          startTransition(async () => {
            await toggleMilestoneFlag(milestoneId, field, next);
          });
        }}
      />
      <span className="flex flex-col gap-0.5">
        <span className="flex items-center gap-2 text-wfc-blue-deep">
          {label}
          {pending ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
        </span>
        <span className="text-[11px] text-wfc-grey">{description}</span>
      </span>
    </label>
  );
}
