export type Segment =
  | "all"
  | "all_with_email"
  | "life"
  | "playing"
  | "sponsors"
  | "gold_sponsors"
  | "paid_2026"
  | "unpaid_2026"
  | "vip";

export const SEGMENT_OPTIONS: ReadonlyArray<{
  value: Segment;
  label: string;
  help: string;
}> = [
  { value: "all", label: "Everyone on the register", help: "All members regardless of type." },
  {
    value: "all_with_email",
    label: "Anyone with an email on file",
    help: "Skips post-only contacts.",
  },
  { value: "life", label: "Life members", help: "" },
  {
    value: "playing",
    label: "Senior + Junior playing",
    help: "Includes senior/junior member types.",
  },
  { value: "sponsors", label: "All sponsors", help: "Gold, silver and bronze tiers." },
  { value: "gold_sponsors", label: "Gold sponsors only", help: "" },
  { value: "vip", label: "VIP", help: "" },
  { value: "paid_2026", label: "Paid current season", help: "Members marked paid this season." },
  { value: "unpaid_2026", label: "Unpaid current season", help: "Renewal nudges." },
];
