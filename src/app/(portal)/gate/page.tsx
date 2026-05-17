import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getGateTotals,
  listGateTakings,
  type GateTakingsListRow,
} from "@/lib/db/gate";
import { SQUAD_SHORT } from "@/lib/db/squads";

export const metadata = { title: "Gate takings" };

function formatAud(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function GateTakingsPage() {
  const [entries, totals] = await Promise.all([listGateTakings(), getGateTotals()]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey">
            Match Day · gate
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            Gate takings
          </h1>
          <p className="mt-1 text-sm text-wfc-grey">
            Manual entry for v1. Square POS sync lands in v2; until then, drop cash + EFTPOS
            and the head counts and the dashboard YTD tile keeps itself current.
          </p>
        </div>
        <Link href="/gate/new">
          <Button size="lg">
            <Plus className="h-4 w-4" aria-hidden />
            Record takings
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Total YTD" value={formatAud(totals.totalAud)} tone="blue" />
        <Tile label="Cash" value={formatAud(totals.cashAud)} tone="grey" />
        <Tile label="EFTPOS" value={formatAud(totals.eftposAud)} tone="grey" />
        <Tile
          label="Headcount"
          value={`${totals.totalAdults + totals.totalConcessions + totals.totalKids}`}
          tone="green"
        />
      </div>

      <section className="rounded-lg border border-wfc-line bg-white">
        <header className="flex items-center justify-between border-b border-wfc-line px-5 py-3">
          <h2 className="font-serif text-base font-semibold text-wfc-blue-deep">
            Recorded takings
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
            {entries.length} entr{entries.length === 1 ? "y" : "ies"}
          </p>
        </header>

        {entries.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-wfc-grey">
            No takings recorded yet.{" "}
            <Link href="/gate/new" className="font-medium text-wfc-blue-deep underline">
              Record the first match
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-wfc-line">
            {entries.map((row) => (
              <Row key={row.id} row={row} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "green" | "grey";
}) {
  const colour =
    tone === "green"
      ? "text-wfc-status-green"
      : tone === "blue"
        ? "text-wfc-blue-deep"
        : "text-wfc-grey";
  return (
    <div className="rounded-md border border-wfc-line bg-white p-3 text-center">
      <div className={`font-display text-2xl leading-none ${colour}`}>{value}</div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-wfc-grey">
        {label}
      </div>
    </div>
  );
}

function Row({ row }: { row: GateTakingsListRow }) {
  const total = Number(row.cash_amount) + Number(row.eftpos_amount);
  const head = row.adults_count + row.concessions_count + row.kids_count;
  return (
    <li className="grid grid-cols-1 gap-1 px-5 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
      <div>
        <Link
          href={`/gate/${row.id}` as Route}
          className="text-sm font-medium text-wfc-blue-deep hover:text-wfc-red"
        >
          {row.fixture_label ?? "Standalone entry"}
          {row.grade ? (
            <span className="ml-2 rounded-full bg-wfc-blue/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-wfc-blue-deep">
              {SQUAD_SHORT[row.grade]}
            </span>
          ) : null}
        </Link>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
          {new Date(row.recorded_at).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}{" "}
          · {row.adults_count} adults · {row.concessions_count} concessions · {row.kids_count}{" "}
          kids · {head} total
        </p>
      </div>
      <span className="font-mono text-[11px] text-wfc-grey">
        cash {formatAud(Number(row.cash_amount))} · eft {formatAud(Number(row.eftpos_amount))}
      </span>
      <span className="font-display text-xl leading-none text-wfc-blue-deep">
        {formatAud(total)}
      </span>
    </li>
  );
}
