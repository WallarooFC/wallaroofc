import type { ActionItemStatus, MeetingType } from "@/lib/db/types";

export const MEETING_TYPE_OPTIONS: ReadonlyArray<{ value: MeetingType; label: string }> = [
  { value: "committee", label: "Committee" },
  { value: "sub_committee", label: "Sub-committee" },
  { value: "agm", label: "AGM" },
  { value: "sgm", label: "SGM" },
];

export const MEETING_TYPE_LABEL: Record<MeetingType, string> = Object.fromEntries(
  MEETING_TYPE_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<MeetingType, string>;

export const ACTION_STATUS_OPTIONS: ReadonlyArray<{
  value: ActionItemStatus;
  label: string;
}> = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export const ACTION_STATUS_LABEL: Record<ActionItemStatus, string> = Object.fromEntries(
  ACTION_STATUS_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<ActionItemStatus, string>;

export const ACTION_STATUS_PILL: Record<ActionItemStatus, string> = {
  open: "bg-wfc-status-amber/15 text-wfc-status-amber",
  in_progress: "bg-wfc-blue/10 text-wfc-blue-deep",
  done: "bg-wfc-status-green/15 text-wfc-status-green",
  cancelled: "bg-wfc-grey/15 text-wfc-grey",
};
