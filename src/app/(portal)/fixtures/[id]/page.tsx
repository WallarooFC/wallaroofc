import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getFixture, listMembersForRoster } from "@/lib/db/fixtures";
import { SQUAD_LABELS } from "@/lib/db/squads";

import { DeleteFixtureButton } from "./_components/delete-fixture-button";
import { ShiftsManager } from "./_components/shifts-manager";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fixture = await getFixture(id);
  if (!fixture) return { title: "Fixture" };
  const label =
    fixture.home_away === "home"
      ? `vs ${fixture.opponent ?? "TBC"}`
      : `@ ${fixture.opponent ?? "TBC"}`;
  return { title: `Rd ${fixture.round_number ?? "?"} ${label}` };
}

export default async function FixtureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [fixture, members] = await Promise.all([
    getFixture(id),
    listMembersForRoster(),
  ]);
  if (!fixture) notFound();

  const dateLabel = new Date(fixture.match_date).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const matchLabel =
    fixture.home_away === "home"
      ? `vs ${fixture.opponent ?? "TBC"}`
      : fixture.home_away === "away"
        ? `@ ${fixture.opponent ?? "TBC"}`
        : (fixture.opponent ?? "TBC");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/fixtures"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
          >
            ← Fixtures
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            Round {fixture.round_number ?? "?"} · {matchLabel}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-wfc-grey">
            <span className="font-mono text-[11px]">{dateLabel}</span>
            {fixture.grade ? (
              <span className="rounded-full bg-wfc-blue/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-blue-deep">
                {SQUAD_LABELS[fixture.grade]}
              </span>
            ) : null}
            {fixture.venue ? (
              <span className="rounded-full bg-wfc-line/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
                {fixture.venue}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/fixtures/${fixture.id}/edit`}>
            <Button variant="secondary">
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          </Link>
          <DeleteFixtureButton
            fixtureId={fixture.id}
            fixtureLabel={`Round ${fixture.round_number ?? "?"} ${matchLabel}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </DeleteFixtureButton>
        </div>
      </header>

      {fixture.notes ? (
        <section className="rounded-lg border-l-[3px] border-wfc-red bg-wfc-cream/60 px-4 py-3 text-sm text-wfc-charcoal">
          <p className="whitespace-pre-line">{fixture.notes}</p>
        </section>
      ) : null}

      <ShiftsManager fixtureId={fixture.id} shifts={fixture.shifts} members={members} />
    </div>
  );
}
