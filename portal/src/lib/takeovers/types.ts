import { z } from "zod";

import type { Template } from "@/lib/templates/types";

export type LandingTakeover = {
  id: string;
  templateId: string;
  startsAt: string;
  endsAt: string;
  isPaused: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LandingTakeoverWithTemplate = LandingTakeover & {
  template: Template;
};

export const scheduleTakeoverSchema = z
  .object({
    templateId: z.string().uuid(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: "End time must be after start time",
    path: ["endsAt"],
  });

export type ScheduleTakeoverInput = z.infer<typeof scheduleTakeoverSchema>;

/**
 * Do two [start, end) intervals overlap?
 *
 * Exported so both the client-side UI (to warn before submit) and the
 * server-side action (for defence-in-depth on top of the DB trigger) can
 * reuse the same rule.
 */
export function windowsOverlap(
  a: { startsAt: string | Date; endsAt: string | Date },
  b: { startsAt: string | Date; endsAt: string | Date },
): boolean {
  const aStart = new Date(a.startsAt).getTime();
  const aEnd = new Date(a.endsAt).getTime();
  const bStart = new Date(b.startsAt).getTime();
  const bEnd = new Date(b.endsAt).getTime();
  return aStart < bEnd && bStart < aEnd;
}

export type TakeoverStatus = "upcoming" | "active" | "past" | "paused";

export function classifyTakeover(
  takeover: Pick<LandingTakeover, "startsAt" | "endsAt" | "isPaused">,
  now: Date = new Date(),
): TakeoverStatus {
  if (takeover.isPaused) return "paused";
  const t = now.getTime();
  if (t < new Date(takeover.startsAt).getTime()) return "upcoming";
  if (t >= new Date(takeover.endsAt).getTime()) return "past";
  return "active";
}
