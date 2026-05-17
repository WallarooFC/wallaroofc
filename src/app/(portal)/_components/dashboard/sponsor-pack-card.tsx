import { getSponsorPackSummary } from "@/lib/db/queries";

import { Card, CardHeader, EmptyState } from "./card";

const STATUS_PILL: Record<string, string> = {
  delivered: "bg-wfc-status-green/15 text-wfc-status-green",
  built: "bg-wfc-status-amber/15 text-wfc-status-amber",
  scheduled: "bg-wfc-status-amber/15 text-wfc-status-amber",
  overdue: "bg-wfc-status-red/15 text-wfc-status-red",
  to_build: "bg-wfc-grey/15 text-wfc-grey",
};

export async function SponsorPackCard() {
  const summary = await getSponsorPackSummary();

  return (
    <Card span={4}>
      <CardHeader
        title="Sponsor Pack Tracker"
        subtitle="Build → deliver → record · 2026 season"
        action="Build new →"
      />
      <div className="mb-4 grid grid-cols-3 gap-2">
        <SummaryTile label="Delivered" value={summary.delivered} color="text-wfc-status-green" />
        <SummaryTile label="Built · ready" value={summary.built} color="text-wfc-status-amber" />
        <SummaryTile label="Overdue" value={summary.overdue} color="text-wfc-red" />
      </div>

      {summary.recent.length === 0 ? (
        <EmptyState>No sponsor packs scheduled yet for 2026.</EmptyState>
      ) : (
        <ul className="divide-y divide-dashed divide-wfc-line">
          {summary.recent.map((row) => (
            <li key={row.id} className="grid grid-cols-[1fr_auto] gap-2 py-2">
              <div>
                <div className="text-sm font-medium text-wfc-blue-deep">{row.sponsorName}</div>
                <div className="text-[10px] text-wfc-grey">
                  {row.tier} · {row.detail}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${STATUS_PILL[row.status] ?? "bg-wfc-line text-wfc-grey"}`}
              >
                {row.status.replace("_", " ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function SummaryTile({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-md border border-wfc-line bg-wfc-cream/40 p-3 text-center">
      <div className={`font-display text-2xl leading-none ${color}`}>{value}</div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-wfc-grey">
        {label}
      </div>
    </div>
  );
}
