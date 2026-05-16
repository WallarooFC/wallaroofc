import Link from "next/link";
import type { Route } from "next";
import { Package, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SPONSOR_TIERS,
  SPONSOR_TIER_LABEL,
  currentSeason,
  listSponsors,
  type SponsorMember,
  type SponsorTier,
} from "@/lib/db/sponsors";

export const metadata = { title: "Sponsors" };

const TIER_CLASS: Record<SponsorTier, string> = {
  gold_sponsor: "border-l-[3px] border-l-wfc-red bg-wfc-red/[0.03]",
  silver_sponsor: "border-l-[3px] border-l-wfc-blue bg-wfc-blue/[0.03]",
  bronze_sponsor: "border-l-[3px] border-l-wfc-grey bg-wfc-cream/40",
};

export default async function SponsorsPage() {
  const season = currentSeason();
  const sponsors = await listSponsors(season);

  const grouped = new Map<SponsorTier, SponsorMember[]>();
  for (const tier of SPONSOR_TIERS) grouped.set(tier.value, []);
  for (const s of sponsors) grouped.get(s.member_type)?.push(s);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey">
            Sponsors · {season}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            Sponsors
          </h1>
          <p className="mt-1 text-sm text-wfc-grey">
            {sponsors.length} sponsor{sponsors.length === 1 ? "" : "s"} on the books for{" "}
            {season} ·{" "}
            {sponsors.filter((s) => !s.has_pack_this_season).length} without a pack yet.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/sponsors/packs">
            <Button variant="secondary" size="lg">
              <Package className="h-4 w-4" aria-hidden />
              Pack tracker
            </Button>
          </Link>
          <Link href="/members/new">
            <Button size="lg">
              <Plus className="h-4 w-4" aria-hidden />
              New sponsor
            </Button>
          </Link>
        </div>
      </header>

      {SPONSOR_TIERS.map((tier) => {
        const tierSponsors = grouped.get(tier.value) ?? [];
        return (
          <section
            key={tier.value}
            className={`rounded-lg border border-wfc-line bg-white ${TIER_CLASS[tier.value]}`}
          >
            <header className="flex items-center justify-between border-b border-wfc-line px-5 py-3">
              <h2 className="font-serif text-base font-semibold text-wfc-blue-deep">
                {SPONSOR_TIER_LABEL[tier.value]}
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
                {tierSponsors.length} sponsor{tierSponsors.length === 1 ? "" : "s"}
              </p>
            </header>
            {tierSponsors.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-wfc-grey">
                No {SPONSOR_TIER_LABEL[tier.value].toLowerCase()} sponsors recorded.
              </p>
            ) : (
              <ul className="divide-y divide-wfc-line">
                {tierSponsors.map((s) => (
                  <li
                    key={s.id}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3"
                  >
                    <Link
                      href={`/members/${s.id}` as Route}
                      className="text-sm text-wfc-blue-deep hover:text-wfc-red"
                    >
                      {s.first_name} {s.last_name}
                      {s.member_number ? (
                        <span className="ml-2 font-mono text-[10px] text-wfc-grey">
                          {s.member_number}
                        </span>
                      ) : null}
                    </Link>
                    <span className="font-mono text-[11px] text-wfc-grey">
                      {s.email ?? s.phone ?? "—"}
                    </span>
                    <span
                      className={
                        s.has_pack_this_season
                          ? "rounded-full bg-wfc-status-green/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-wfc-status-green"
                          : "rounded-full bg-wfc-status-amber/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-wfc-status-amber"
                      }
                    >
                      {s.has_pack_this_season ? "Pack on file" : "No pack yet"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
