import Link from "next/link";
import type { Route } from "next";

import { getAttentionFeed, type AttentionSeverity } from "@/lib/attention";

import { Card, CardHeader, EmptyState } from "./card";

const MARKER_CLASS: Record<AttentionSeverity, string> = {
  red: "bg-wfc-status-red",
  amber: "bg-wfc-status-amber",
  blue: "bg-wfc-blue",
  green: "bg-wfc-status-green",
};

export async function AttentionCard() {
  const items = await getAttentionFeed(7);

  return (
    <Card span={7}>
      <CardHeader
        title="Attention Required"
        subtitle="Auto-flagged items the secretary should action this week"
        action={items.length > 0 ? `View all (${items.length})` : undefined}
      />

      {items.length === 0 ? (
        <EmptyState>
          Nothing requires action right now — when PlayHQ regos, expiring WWCCs, or unfilled
          shifts appear they&apos;ll surface here.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-wfc-line">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-4 py-4">
              <span
                aria-hidden
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${MARKER_CLASS[item.severity]}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
                  <span className="font-mono">{item.category}</span>
                  <span className="font-mono text-wfc-grey/80">{item.time}</span>
                </div>
                <p className="mt-1 text-sm text-wfc-blue-deep">{item.message}</p>
                <p className="mt-1 text-[11px] text-wfc-grey">{item.detail}</p>
              </div>
              <Link
                href={item.href as Route}
                className="shrink-0 rounded-md bg-wfc-red px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-wfc-cream transition-colors hover:bg-wfc-red-deep"
              >
                {item.cta}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
