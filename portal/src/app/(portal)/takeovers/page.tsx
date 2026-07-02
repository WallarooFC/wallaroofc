import Link from "next/link";

import { listTakeovers } from "@/lib/takeovers/queries";
import { classifyTakeover, type TakeoverStatus } from "@/lib/takeovers/types";

import { TakeoverRowActions } from "./row-actions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<TakeoverStatus, { label: string; className: string }> = {
  active: { label: "Live now", className: "bg-wfc-status-green/15 text-wfc-status-green" },
  upcoming: { label: "Upcoming", className: "bg-wfc-blue-deep/10 text-wfc-blue-deep" },
  past: { label: "Finished", className: "bg-wfc-grey/15 text-wfc-grey" },
  paused: { label: "Paused", className: "bg-wfc-status-amber/15 text-wfc-status-amber" },
};

export default async function TakeoversPage() {
  const takeovers = await listTakeovers().catch(() => []);

  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-8 px-8 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-headline text-wfc-red text-xs tracking-[0.3em] uppercase">
            Landing page
          </p>
          <h1 className="font-display text-wfc-blue-deep text-5xl leading-none uppercase">
            Takeovers
          </h1>
          <p className="text-wfc-charcoal mt-2 max-w-2xl font-serif text-base">
            Schedule a landing-takeover template to show as a centred overlay on wallaroofc.com.
            Runs for 10 seconds on every landing-page visit during the window. Only one takeover can
            be active at a time.
          </p>
        </div>
        <Link
          href="/takeovers/new"
          className="bg-wfc-red hover:bg-wfc-red-deep flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold text-white transition"
        >
          + Schedule takeover
        </Link>
      </header>

      {takeovers.length === 0 ? (
        <div className="border-wfc-line rounded-lg border border-dashed p-12 text-center">
          <p className="text-wfc-charcoal font-serif text-lg">Nothing scheduled.</p>
          <p className="text-wfc-grey mt-2 text-sm">
            Create a landing-takeover template first, then schedule when it should show.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {takeovers.map((takeover) => {
            const status = classifyTakeover(takeover);
            const style = STATUS_STYLES[status];
            return (
              <li
                key={takeover.id}
                className="border-wfc-line flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-white p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-headline rounded-full px-2.5 py-0.5 text-[10px] tracking-[0.14em] uppercase ${style.className}`}
                    >
                      {style.label}
                    </span>
                    <span className="text-wfc-blue-deep truncate font-serif text-lg font-semibold">
                      {takeover.template.title}
                    </span>
                  </div>
                  <p className="text-wfc-grey mt-1 text-xs">
                    {new Date(takeover.startsAt).toLocaleString("en-AU", {
                      timeZone: "Australia/Adelaide",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    →{" "}
                    {new Date(takeover.endsAt).toLocaleString("en-AU", {
                      timeZone: "Australia/Adelaide",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <TakeoverRowActions id={takeover.id} status={status} />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
