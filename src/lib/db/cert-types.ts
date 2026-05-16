import type { CertType } from "@/lib/db/types";

export const CERT_TYPE_OPTIONS: ReadonlyArray<{ value: CertType; label: string }> = [
  { value: "wwcc", label: "Working with Children Check" },
  { value: "first_aid", label: "First Aid Certificate" },
  { value: "rsa", label: "Responsible Service of Alcohol" },
  { value: "trainer_level_0", label: "Trainer · Level 0" },
  { value: "trainer_level_1", label: "Trainer · Level 1" },
  { value: "trainer_level_2", label: "Trainer · Level 2" },
  { value: "coach_accred", label: "Coach Accreditation" },
  { value: "other", label: "Other" },
];

export const CERT_TYPE_LABEL: Record<CertType, string> = Object.fromEntries(
  CERT_TYPE_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<CertType, string>;

export const CERT_TYPE_SHORT: Record<CertType, string> = {
  wwcc: "WWCC",
  first_aid: "First Aid",
  rsa: "RSA",
  trainer_level_0: "Trainer L0",
  trainer_level_1: "Trainer L1",
  trainer_level_2: "Trainer L2",
  coach_accred: "Coach",
  other: "Other",
};
