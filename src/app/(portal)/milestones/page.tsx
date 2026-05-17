import Link from "next/link";
import type { Route } from "next";
import { Plus, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  MILESTONE_STATUS_LABEL,
  MILESTONE_STATUS_PILL,
  MILESTONE_TYPE_LABEL,
} from "@/lib/db/milestone-types";
import { listMilestones } from "@/lib/db/milestones";
import { SQUAD_SHORT } from "@/lib/db/squads";

import { SyncMilestonesButton } from "./_components/sync-button";

export const metadata = { title: "Milestones" };

const STATUS_ORDER = ["imminent", "upcoming", "completed", "passed"] as const;

export default async function MilestonesPage() {
  const rows = await listMilestones();

  const counts = rows.reduce(
    (acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey">
            Register · senior milestones
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            Milestones
          </h1>
          <p className="mt-1 text-sm text-wfc-grey">
            {rows.length} milestone{rows.length === 1 ? "" : "s"} on the radar ·{" "}
            {counts.imminent ?? 0} imminent · {counts.upcoming ?? 0} upcoming.
          </p>
        </div>
        <div className="flex gap-2">
          <SyncMilestonesButton>
            <Wand2 className="h-4 w-4" aria-hidden />
            Auto-detect
          </SyncMilestonesButton>
          <Link href="/milestones/new">
            <Button size="lg">
              <Plus className="h-4 w-4" aria-hidden />
              New milestone
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUS_ORDER.map((status) => (
          <div
            key={status}
            className="rounded-md border border-wfc-line bg-white p-3 text-center"
          >
            <div className="font-display text-2xl leading-none text-wfc-blue-deep">
              {counts[status] ?? 0}
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-wfc-grey">
              {MILESTONE_STATUS_LABEL[status]}
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-wfc-line bg-white">
        {rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-wfc-grey">
            No milestones recorded.{" "}
            <Link
              href="/milestones/new"
              className="font-medium text-wfc-blue-deep underline"
            >
              Add the first one
            </Link>{" "}
            or click <span className="font-medium">Auto-detect</span> to populate them from
            current senior-game counts.
          </p>
        ) : (
          <ul className="divide-y divide-wfc-line">
            {STATUS_ORDER.flatMap((status) =>
              rows
                .filter((r) => r.status === status)
                .map((row) => (
                  <li
                    key={row.id}
                    className="grid grid-cols-[64px_1fr_auto] items-center gap-4 px-5 py-3"
                  >
                    <span className="font-display text-3xl leading-none text-wfc-blue-deep">
                      {row.target_game_count ?? "—"}
                    </span>
                    <div>
                      <Link
                        href={`/milestones/${row.id}` as Route}
                        className="text-sm font-medium text-wfc-blue-deep hover:text-wfc-red"
                      >
                        {row.player_name}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-wfc-grey">
                        {row.milestone_type
                          ? MILESTONE_TYPE_LABEL[row.milestone_type]
                          : "Milestone"}
                        {row.squad ? ` · ${SQUAD_SHORT[row.squad]}` : ""} ·{" "}
                        {row.games_played_seniors} senior games
                        {row.fixture_label
                          ? ` · ${row.fixture_label}${row.fixture_date ? ` · ${new Date(row.fixture_date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}` : ""}`
                          : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <ChecklistPill on={row.jumper_ordered} label="jumper" />
                        <ChecklistPill on={row.presentation_planned} label="presentation" />
                        <ChecklistPill on={row.media_release_sent} label="media" />
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${MILESTONE_STATUS_PILL[row.status]}`}
                    >
                      {MILESTONE_STATUS_LABEL[row.status]}
                    </span>
                  </li>
                )),
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

function ChecklistPill({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={
        on
          ? "rounded-sm bg-wfc-status-green/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-wfc-status-green"
          : "rounded-sm bg-wfc-grey/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-wfc-grey"
      }
    >
      {on ? "✓" : "○"} {label}
    </span>
  );
}
