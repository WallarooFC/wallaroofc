import Link from "next/link";
import type { Route } from "next";

import {
  listFixturesInRange,
  ROSTER_ROLE_LABEL,
  shiftFillStatus,
  type ShiftWithAssignments,
} from "@/lib/db/fixtures";
import { SQUAD_LABELS } from "@/lib/db/squads";

export const metadata = { title: "Rosters" };

const HORIZON_DAYS = 28;

const STATUS_PILL = {
  filled: "bg-wfc-status-green/15 text-wfc-status-green",
  partial: "bg-wfc-status-amber/15 text-wfc-status-amber",
  empty: "bg-wfc-status-red/15 text-wfc-status-red",
} as const;

export default async function RostersPage() {
  const today = new Date();
  const horizon = new Date(today.getTime() + HORIZON_DAYS * 86400_000);
  const fixtures = await listFixturesInRange(
    today.toISOString().slice(0, 10),
    horizon.toISOString().slice(0, 10),
  );

  const totals = fixtures.reduce(
    (acc, fixture) => {
      for (const shift of fixture.shifts) {
        const status = shiftFillStatus(shift);
        acc[status] += 1;
        acc.total += 1;
      }
      return acc;
    },
    { filled: 0, partial: 0, empty: 0, total: 0 },
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey">
          Match Day · next {HORIZON_DAYS} days
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          Rosters
        </h1>
        <p className="mt-1 text-sm text-wfc-grey">
          {totals.total} shift{totals.total === 1 ? "" : "s"} across {fixtures.length} upcoming
          fixture{fixtures.length === 1 ? "" : "s"} ·{" "}
          <span className="font-medium text-wfc-status-green">{totals.filled} filled</span> ·{" "}
          <span className="font-medium text-wfc-status-amber">{totals.partial} partial</span> ·{" "}
          <span className="font-medium text-wfc-status-red">{totals.empty} unfilled</span>
        </p>
      </header>

      {fixtures.length === 0 ? (
        <section className="rounded-lg border border-dashed border-wfc-line bg-wfc-cream/40 p-6 text-center text-sm text-wfc-grey">
          No fixtures in the next {HORIZON_DAYS} days.{" "}
          <Link href="/fixtures/new" className="font-medium text-wfc-blue-deep underline">
            Add one
          </Link>
          .
        </section>
      ) : (
        <div className="flex flex-col gap-5">
          {fixtures.map((fixture) => (
            <FixtureCard key={fixture.id} fixture={fixture} />
          ))}
        </div>
      )}
    </div>
  );
}

function FixtureCard({
  fixture,
}: {
  fixture: Awaited<ReturnType<typeof listFixturesInRange>>[number];
}) {
  const date = new Date(fixture.match_date).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const matchLabel =
    fixture.home_away === "home"
      ? `vs ${fixture.opponent ?? "TBC"}`
      : fixture.home_away === "away"
        ? `@ ${fixture.opponent ?? "TBC"}`
        : (fixture.opponent ?? "TBC");

  // Group shifts by role for the grid.
  const grouped = new Map<string, ShiftWithAssignments[]>();
  for (const shift of fixture.shifts) {
    const arr = grouped.get(shift.role) ?? [];
    arr.push(shift);
    grouped.set(shift.role, arr);
  }

  return (
    <section className="rounded-lg border border-wfc-line bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-wfc-line px-5 py-3">
        <div>
          <h2 className="font-serif text-base font-semibold text-wfc-blue-deep">
            Round {fixture.round_number ?? "?"} · {matchLabel}
          </h2>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-wfc-grey">
            {date}
            {fixture.grade ? ` · ${SQUAD_LABELS[fixture.grade]}` : ""}
            {fixture.venue ? ` · ${fixture.venue}` : ""}
          </p>
        </div>
        <Link
          href={`/fixtures/${fixture.id}` as Route}
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-wfc-blue-deep hover:text-wfc-red"
        >
          Open roster →
        </Link>
      </header>

      {fixture.shifts.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-wfc-grey">No shifts configured yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(grouped.entries()).map(([role, shifts]) => (
            <article key={role} className="rounded-md border border-wfc-line bg-wfc-cream/30 p-3">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-wfc-grey">
                {ROSTER_ROLE_LABEL[role as keyof typeof ROSTER_ROLE_LABEL] ?? role}
              </h3>
              <ul className="mt-2 space-y-2">
                {shifts.map((shift) => {
                  const status = shiftFillStatus(shift);
                  const confirmed = shift.assignments.filter(
                    (a) => a.status === "confirmed",
                  ).length;
                  return (
                    <li key={shift.id} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-wfc-grey">
                          {shift.start_time && shift.end_time
                            ? `${shift.start_time}–${shift.end_time}`
                            : "all day"}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${STATUS_PILL[status]}`}
                        >
                          {confirmed}/{shift.slots_required}
                        </span>
                      </div>
                      {shift.assignments.length > 0 ? (
                        <p className="mt-1 text-[11px] text-wfc-blue-deep">
                          {shift.assignments
                            .map((a) =>
                              a.status === "confirmed"
                                ? a.member_name
                                : `${a.member_name} (${a.status})`,
                            )
                            .join(", ")}
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] italic text-wfc-status-amber">
                          No one assigned yet
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
