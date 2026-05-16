import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PACK_STATUS_LABEL,
  PACK_STATUS_PILL,
  SPONSOR_TIER_LABEL,
  currentSeason,
  listSponsorPacks,
  type SponsorPackListRow,
} from "@/lib/db/sponsors";

export const metadata = { title: "Sponsor packs" };

export default async function SponsorPacksPage() {
  const season = currentSeason();
  const packs = await listSponsorPacks(season);

  const tally = packs.reduce(
    (acc, pack) => {
      acc[pack.pack_status] = (acc[pack.pack_status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/sponsors"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
          >
            ← Sponsors
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            Pack tracker · {season}
          </h1>
          <p className="mt-1 text-sm text-wfc-grey">
            Build → schedule → deliver → record. {packs.length} pack
            {packs.length === 1 ? "" : "s"} this season.
          </p>
        </div>
        <Link href="/sponsors/packs/new">
          <Button size="lg">
            <Plus className="h-4 w-4" aria-hidden />
            New pack
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(["to_build", "built", "scheduled", "delivered", "overdue"] as const).map((key) => (
          <div
            key={key}
            className="rounded-md border border-wfc-line bg-white p-3 text-center"
          >
            <div className="font-display text-2xl leading-none text-wfc-blue-deep">
              {tally[key] ?? 0}
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-wfc-grey">
              {PACK_STATUS_LABEL[key]}
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-wfc-line bg-white">
        {packs.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-wfc-grey">
            No packs for {season} yet.{" "}
            <Link
              href="/sponsors/packs/new"
              className="font-medium text-wfc-blue-deep underline"
            >
              Build the first one
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-wfc-line">
            {packs.map((pack) => (
              <PackRow key={pack.id} pack={pack} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PackRow({ pack }: { pack: SponsorPackListRow }) {
  const items = pack.contents
    .map((c) => `${c.qty}× ${c.item}`)
    .slice(0, 4)
    .join(", ");
  const remainder = pack.contents.length > 4 ? ` + ${pack.contents.length - 4} more` : "";

  return (
    <li className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <Link
          href={`/sponsors/packs/${pack.id}` as Route}
          className="text-sm font-medium text-wfc-blue-deep hover:text-wfc-red"
        >
          {pack.sponsor_name}
        </Link>
        <p className="mt-0.5 text-[11px] text-wfc-grey">
          {pack.sponsor_tier
            ? `${SPONSOR_TIER_LABEL[pack.sponsor_tier as keyof typeof SPONSOR_TIER_LABEL] ?? pack.sponsor_tier} · `
            : ""}
          {items || "pack contents tbc"}
          {remainder}
        </p>
        {pack.scheduled_delivery ? (
          <p className="mt-0.5 font-mono text-[10px] text-wfc-grey">
            Scheduled {new Date(pack.scheduled_delivery).toLocaleDateString("en-AU")}
          </p>
        ) : null}
      </div>
      <span
        className={`justify-self-start rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] sm:justify-self-end ${PACK_STATUS_PILL[pack.pack_status]}`}
      >
        {PACK_STATUS_LABEL[pack.pack_status]}
      </span>
    </li>
  );
}
