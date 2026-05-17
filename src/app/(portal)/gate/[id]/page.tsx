import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getGateTakings } from "@/lib/db/gate";
import { SQUAD_LABELS } from "@/lib/db/squads";

import { DeleteGateTakingsButton } from "./_components/delete-button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await getGateTakings(id);
  return {
    title: entry
      ? `Takings · ${entry.fixture_label ?? new Date(entry.recorded_at).toLocaleDateString("en-AU")}`
      : "Gate takings",
  };
}

function formatAud(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

export default async function GateTakingsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await getGateTakings(id);
  if (!entry) notFound();

  const total = Number(entry.cash_amount) + Number(entry.eftpos_amount);
  const head = entry.adults_count + entry.concessions_count + entry.kids_count;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/gate"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
          >
            ← Gate takings
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            {entry.fixture_label ?? "Standalone entry"}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-wfc-grey">
            {entry.grade ? (
              <span className="rounded-full bg-wfc-blue/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-blue-deep">
                {SQUAD_LABELS[entry.grade]}
              </span>
            ) : null}
            <span className="font-mono text-[11px]">
              Recorded {new Date(entry.recorded_at).toLocaleString("en-AU")}
            </span>
            <span className="font-display text-2xl leading-none text-wfc-red">
              {formatAud(total)}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {entry.fixture_id ? (
            <Link href={`/fixtures/${entry.fixture_id}`}>
              <Button variant="secondary">View fixture</Button>
            </Link>
          ) : null}
          <Link href={`/gate/${entry.id}/edit`}>
            <Button variant="secondary">
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          </Link>
          <DeleteGateTakingsButton entryId={entry.id}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </DeleteGateTakingsButton>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-wfc-line bg-white p-5">
          <h2 className="mb-3 font-serif text-base font-semibold text-wfc-blue-deep">
            Money
          </h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Detail label="Cash" value={formatAud(Number(entry.cash_amount))} mono />
            <Detail label="EFTPOS" value={formatAud(Number(entry.eftpos_amount))} mono />
            <Detail label="Total" value={formatAud(total)} mono accent />
          </dl>
        </section>

        <section className="rounded-lg border border-wfc-line bg-white p-5">
          <h2 className="mb-3 font-serif text-base font-semibold text-wfc-blue-deep">
            Headcount
          </h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Detail label="Adults" value={String(entry.adults_count)} mono />
            <Detail label="Concessions" value={String(entry.concessions_count)} mono />
            <Detail label="Kids" value={String(entry.kids_count)} mono />
            <Detail label="Total through gate" value={String(head)} mono accent />
          </dl>
        </section>

        {entry.notes ? (
          <section className="rounded-lg border border-wfc-line bg-white p-5 lg:col-span-2">
            <h2 className="mb-3 font-serif text-base font-semibold text-wfc-blue-deep">
              Notes
            </h2>
            <p className="whitespace-pre-line text-sm text-wfc-charcoal">{entry.notes}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">{label}</dt>
      <dd
        className={
          accent
            ? "font-display text-2xl leading-none text-wfc-blue-deep"
            : mono
              ? "font-mono text-[12px] text-wfc-blue-deep"
              : "text-sm text-wfc-charcoal"
        }
      >
        {value}
      </dd>
    </div>
  );
}
