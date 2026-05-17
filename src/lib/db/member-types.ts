import type { MemberType } from "@/lib/db/types";

export const MEMBER_TYPE_OPTIONS: ReadonlyArray<{ value: MemberType; label: string }> = [
  { value: "life", label: "Life Member" },
  { value: "senior", label: "Senior" },
  { value: "junior", label: "Junior" },
  { value: "gold_sponsor", label: "Gold Sponsor" },
  { value: "silver_sponsor", label: "Silver Sponsor" },
  { value: "bronze_sponsor", label: "Bronze Sponsor" },
  { value: "vip", label: "VIP" },
  { value: "honorary", label: "Honorary" },
  { value: "other", label: "Other" },
];
