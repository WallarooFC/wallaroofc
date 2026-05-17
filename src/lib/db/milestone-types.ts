import type { MilestoneStatus, MilestoneType } from "@/lib/db/types";

export const MILESTONE_TYPE_OPTIONS: ReadonlyArray<{ value: MilestoneType; label: string }> = [
  { value: "50_games", label: "50 games" },
  { value: "100_games", label: "100 games" },
  { value: "150_games", label: "150 games" },
  { value: "200_games", label: "200 games" },
  { value: "250_games", label: "250 games" },
  { value: "300_games", label: "300 games" },
  { value: "life_member", label: "Life membership" },
  { value: "other", label: "Other" },
];

export const MILESTONE_STATUS_OPTIONS: ReadonlyArray<{
  value: MilestoneStatus;
  label: string;
}> = [
  { value: "upcoming", label: "Upcoming" },
  { value: "imminent", label: "Imminent" },
  { value: "completed", label: "Completed" },
  { value: "passed", label: "Passed" },
];

export const MILESTONE_TYPE_LABEL: Record<MilestoneType, string> = Object.fromEntries(
  MILESTONE_TYPE_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<MilestoneType, string>;

export const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = Object.fromEntries(
  MILESTONE_STATUS_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<MilestoneStatus, string>;

export const MILESTONE_STATUS_PILL: Record<MilestoneStatus, string> = {
  upcoming: "bg-wfc-blue/10 text-wfc-blue-deep",
  imminent: "bg-wfc-status-amber/15 text-wfc-status-amber",
  completed: "bg-wfc-status-green/15 text-wfc-status-green",
  passed: "bg-wfc-grey/15 text-wfc-grey",
};

export const GAME_THRESHOLDS = [
  { type: "50_games", target: 50 },
  { type: "100_games", target: 100 },
  { type: "150_games", target: 150 },
  { type: "200_games", target: 200 },
  { type: "250_games", target: 250 },
  { type: "300_games", target: 300 },
] as const;
