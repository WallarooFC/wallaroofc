import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MEETING_TYPE_LABEL, listAgendas } from "@/lib/db/agendas";

export const metadata = { title: "Agendas & minutes" };

export default async function AgendasPage() {
  const rows = await listAgendas();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey">
            Governance · meetings
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            Agendas &amp; minutes
          </h1>
          <p className="mt-1 text-sm text-wfc-grey">
            {rows.length} meeting{rows.length === 1 ? "" : "s"} recorded. Markdown editor +
            action items + attendance attached to each.
          </p>
        </div>
        <Link href="/agendas/new">
          <Button size="lg">
            <Plus className="h-4 w-4" aria-hidden />
            New agenda
          </Button>
        </Link>
      </header>

      <section className="rounded-lg border border-wfc-line bg-white">
        {rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-wfc-grey">
            No agendas yet.{" "}
            <Link href="/agendas/new" className="font-medium text-wfc-blue-deep underline">
              Schedule the first meeting
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-wfc-line">
            {rows.map((row) => (
              <li
                key={row.id}
                className="grid grid-cols-[80px_1fr_auto_auto] items-center gap-4 px-5 py-3"
              >
                <div className="flex flex-col items-center justify-center rounded-md bg-wfc-cream py-1.5">
                  <div className="font-display text-xl leading-none text-wfc-blue-deep">
                    {new Date(row.meeting_date).getDate()}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-wfc-grey">
                    {new Date(row.meeting_date).toLocaleString("en-AU", { month: "short" })}
                  </div>
                </div>
                <div>
                  <Link
                    href={`/agendas/${row.id}` as Route}
                    className="text-sm font-medium text-wfc-blue-deep hover:text-wfc-red"
                  >
                    {MEETING_TYPE_LABEL[row.meeting_type]} ·{" "}
                    {new Date(row.meeting_date).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Link>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
                    {row.action_item_count} action{row.action_item_count === 1 ? "" : "s"} ·{" "}
                    {row.open_action_count} open
                  </p>
                </div>
                <span
                  className={
                    row.published
                      ? "rounded-full bg-wfc-status-green/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-wfc-status-green"
                      : "rounded-full bg-wfc-grey/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-wfc-grey"
                  }
                >
                  {row.published ? "Published" : "Draft"}
                </span>
                <span aria-hidden />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
