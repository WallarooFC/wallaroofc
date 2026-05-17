import type { SponsorPackStatus } from "@/lib/db/types";

export type SponsorTier = "gold_sponsor" | "silver_sponsor" | "bronze_sponsor";

export const SPONSOR_TIERS: ReadonlyArray<{ value: SponsorTier; label: string }> = [
  { value: "gold_sponsor", label: "Gold" },
  { value: "silver_sponsor", label: "Silver" },
  { value: "bronze_sponsor", label: "Bronze" },
];

export const SPONSOR_TIER_LABEL: Record<SponsorTier, string> = {
  gold_sponsor: "Gold",
  silver_sponsor: "Silver",
  bronze_sponsor: "Bronze",
};

export const PACK_STATUS_OPTIONS: ReadonlyArray<{
  value: SponsorPackStatus;
  label: string;
}> = [
  { value: "to_build", label: "To build" },
  { value: "built", label: "Built · ready" },
  { value: "scheduled", label: "Scheduled" },
  { value: "delivered", label: "Delivered" },
  { value: "overdue", label: "Overdue" },
];

export const PACK_STATUS_LABEL: Record<SponsorPackStatus, string> = Object.fromEntries(
  PACK_STATUS_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<SponsorPackStatus, string>;

export const PACK_STATUS_PILL: Record<SponsorPackStatus, string> = {
  to_build: "bg-wfc-grey/15 text-wfc-grey",
  built: "bg-wfc-status-amber/15 text-wfc-status-amber",
  scheduled: "bg-wfc-status-amber/15 text-wfc-status-amber",
  delivered: "bg-wfc-status-green/15 text-wfc-status-green",
  overdue: "bg-wfc-status-red/15 text-wfc-status-red",
};

export function currentSeason(): number {
  return new Date().getFullYear();
}
