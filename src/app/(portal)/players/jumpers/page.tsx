import Link from "next/link";
import type { Route } from "next";

import { buildJumperMaps, listPlayers } from "@/lib/db/players";
import { SQUAD_LABELS, SQUAD_ORDER } from "@/lib/db/squads";
import { cn } from "@/lib/utils";

const MAX_NUMBER = 60;

export const metadata = { title: "Jumper number map" };

export default async function JumpersPage() {
  const players = await listPlayers();
  const maps = buildJumperMaps(players, SQUAD_ORDER, MAX_NUMBER);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/players"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← Players
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          Jumper number map
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-wfc-grey">
          Available, taken, and retired numbers per squad. Click a taken cell to open the
          player. Empty cells show in cream so allocation gaps are obvious at a glance.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {maps.map((map) => {
          const totalTaken = map.takenByNumber.size;
          return (
            <section key={map.squad} className="rounded-lg border border-wfc-line bg-white p-5">
              <header className="mb-3 flex items-center justify-between">
                <h2 className="font-serif text-base font-semibold text-wfc-blue-deep">
                  {SQUAD_LABELS[map.squad]}
                </h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-wfc-grey">
                  {totalTaken} / {MAX_NUMBER} numbered
                </span>
              </header>
              <div className="grid grid-cols-10 gap-1 text-center font-mono text-[11px]">
                {map.range.map((n) => {
                  const taken = map.takenByNumber.get(n);
                  if (!taken) {
                    return (
                      <span
                        key={n}
                        className="rounded-sm border border-wfc-line bg-wfc-cream/70 px-1 py-1.5 text-wfc-grey/70"
                      >
                        {n}
                      </span>
                    );
                  }
                  const className =
                    taken.status === "retired"
                      ? "bg-wfc-grey/40 text-wfc-cream"
                      : taken.status === "confirmed"
                        ? "bg-wfc-red/15 text-wfc-red"
                        : "bg-wfc-status-amber/20 text-wfc-status-amber";
                  return (
                    <Link
                      key={n}
                      href={`/players/${taken.id}` as Route}
                      className={cn(
                        "block rounded-sm px-1 py-1.5 text-wfc-blue-deep transition hover:ring-2 hover:ring-wfc-red/40",
                        className,
                      )}
                      title={`${taken.name} · ${taken.status}`}
                    >
                      {n}
                    </Link>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-wfc-line pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-wfc-grey">
                <LegendDot className="bg-wfc-red/15" label="Confirmed" />
                <LegendDot className="bg-wfc-status-amber/20" label="Pending / suggested" />
                <LegendDot className="bg-wfc-grey/40" label="Retired" />
                <LegendDot className="bg-wfc-cream border border-wfc-line" label="Available" />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm ${className}`} aria-hidden />
      {label}
    </span>
  );
}
