import { getUpcomingDeadlines } from "@/lib/db/queries";

import { Card, CardHeader, EmptyState } from "./card";

function daysFromNow(iso: string): number {
  return Math.max(
    0,
    Math.round((new Date(iso).getTime() - Date.now()) / 86400_000),
  );
}

export async function DeadlinesCard() {
  const rows = await getUpcomingDeadlines(6);

  return (
    <Card span={6}>
      <CardHeader
        title="Upcoming Deadlines"
        subtitle="Hard-dated obligations the club must hit"
        action="Open calendar"
      />
      {rows.length === 0 ? (
        <EmptyState>No deadlines on the radar.</EmptyState>
      ) : (
        <ul className="divide-y divide-dashed divide-wfc-line">
          {rows.map((row) => {
            const date = new Date(row.date);
            const days = daysFromNow(row.date);
            return (
              <li
                key={row.id}
                className="grid grid-cols-[56px_1fr_auto] items-center gap-3 py-3"
              >
                <div className="flex flex-col items-center justify-center rounded-md bg-wfc-cream py-1.5">
                  <div className="font-display text-lg leading-none text-wfc-blue-deep">
                    {date.getDate()}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-wfc-grey">
                    {date.toLocaleString("en-AU", { month: "short" })}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm text-wfc-blue-deep">{row.title}</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-wfc-grey">
                    {row.tag}
                  </div>
                </div>
                <span
                  className={[
                    "font-mono text-[10px] uppercase tracking-[0.12em]",
                    days <= 7
                      ? "text-wfc-red"
                      : days <= 30
                        ? "text-wfc-status-amber"
                        : "text-wfc-grey",
                  ].join(" ")}
                >
                  in {days} day{days === 1 ? "" : "s"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
