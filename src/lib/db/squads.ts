import type { Squad, YearInGrade } from "@/lib/db/types";

export const SQUAD_ORDER: readonly Squad[] = [
  "seniors",
  "reserves",
  "snr_colts",
  "jnr_colts",
  "u11s",
  "u9s",
];

export const SQUAD_LABELS: Record<Squad, string> = {
  seniors: "Seniors",
  reserves: "Reserves",
  snr_colts: "SNR Colts",
  jnr_colts: "JNR Colts",
  u11s: "Under 11s",
  u9s: "Under 9s",
};

export const SQUAD_SHORT: Record<Squad, string> = {
  seniors: "SNR",
  reserves: "RES",
  snr_colts: "SC",
  jnr_colts: "JC",
  u11s: "U11",
  u9s: "U9",
};

export const YEAR_LABELS: Record<YearInGrade, string> = {
  first: "First year",
  middle: "Middle year",
  last: "Last year",
  last_exempt: "Last year (exempt)",
};

export const SQUAD_OPTIONS: ReadonlyArray<{ value: Squad; label: string }> = SQUAD_ORDER.map(
  (squad) => ({ value: squad, label: SQUAD_LABELS[squad] }),
);

export const YEAR_OPTIONS: ReadonlyArray<{ value: YearInGrade; label: string }> = (
  ["first", "middle", "last", "last_exempt"] as const
).map((value) => ({ value, label: YEAR_LABELS[value] }));

export function isJunior(squad: Squad): boolean {
  return squad !== "seniors" && squad !== "reserves";
}
