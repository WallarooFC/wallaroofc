import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listFixtures } from "@/lib/db/fixtures";
import { SQUAD_LABELS } from "@/lib/db/squads";

export const metadata = { title: "Fixtures" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default async function FixturesPage() {
  const rows = await listFixtures();
  const todayIso = new Date().toISOString().slice(0, 10);
  const upcoming = rows.filter((r) => r.match_date >= todayIso);
  const past = rows.filter((r) => r.match_date < todayIso).reverse();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey">
            Match Day · 2026
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            Fixtures
          </h1>
          <p className="mt-1 text-sm text-wfc-grey">
            {upcoming.length} upcoming · {past.length} past · rosters and shifts attached to
            each fixture.
          </p>
        </div>
        <Link href="/fixtures/new">
          <Button size="lg">
            <Plus className="h-4 w-4" aria-hidden />
            New fixture
          </Button>
        </Link>
      </header>

      <FixtureTable title="Upcoming" rows={upcoming} emptyCopy="No fixtures scheduled." />
      {past.length > 0 ? <FixtureTable title="Past" rows={past} emptyCopy="" /> : null}
    </div>
  );
}

function FixtureTable({
  title,
  rows,
  emptyCopy,
}: {
  title: string;
  rows: Awaited<ReturnType<typeof listFixtures>>;
  emptyCopy: string;
}) {
  return (
    <section className="rounded-lg border border-wfc-line bg-white">
      <header className="border-b border-wfc-line px-5 py-3">
        <h2 className="font-serif text-base font-semibold text-wfc-blue-deep">{title}</h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
          {rows.length} fixture{rows.length === 1 ? "" : "s"}
        </p>
      </header>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-wfc-grey">{emptyCopy}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="bg-wfc-cream/40 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
                <th className="px-4 py-2 font-medium">Rd</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Grade</th>
                <th className="px-4 py-2 font-medium">Match</th>
                <th className="px-4 py-2 font-medium">Venue</th>
                <th className="px-4 py-2 font-medium">Shifts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id} className="border-t border-wfc-line hover:bg-wfc-cream/30">
                  <td className="px-4 py-2 font-mono text-[11px] text-wfc-blue-deep">
                    {f.round_number ?? "—"}
                  </td>
                  <td className="px-4 py-2 font-mono text-[11px] text-wfc-blue-deep">
                    {formatDate(f.match_date)}
                  </td>
                  <td className="px-4 py-2">
                    {f.grade ? (
                      <span className="rounded-full bg-wfc-blue/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-wfc-blue-deep">
                        {SQUAD_LABELS[f.grade]}
                      </span>
                    ) : (
                      <span className="text-wfc-grey">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/fixtures/${f.id}` as Route}
                      className="text-wfc-blue-deep hover:text-wfc-red"
                    >
                      {f.home_away === "home"
                        ? `vs ${f.opponent ?? "TBC"}`
                        : f.home_away === "away"
                          ? `@ ${f.opponent ?? "TBC"}`
                          : (f.opponent ?? "TBC")}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-xs text-wfc-charcoal">{f.venue ?? "—"}</td>
                  <td className="px-4 py-2 font-mono text-[11px] text-wfc-grey">
                    {f.shift_count} shift{f.shift_count === 1 ? "" : "s"} ·{" "}
                    {f.assignment_count} assignment{f.assignment_count === 1 ? "" : "s"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
