import { getNextMatchDayRoster, type RosterShiftView } from "@/lib/db/queries";

import { Card, CardHeader, EmptyState } from "./card";

const STATUS_DOT: Record<RosterShiftView["status"], string> = {
  filled: "bg-wfc-status-green",
  partial: "bg-wfc-status-amber",
  empty: "bg-wfc-status-red",
};

export async function MatchDayRosterCard() {
  const data = await getNextMatchDayRoster();

  if (!data.fixture) {
    return (
      <Card span={4}>
        <CardHeader title="Match Day · Next Roster" subtitle="No upcoming fixture scheduled" />
        <EmptyState>Add fixtures to populate the weekly roster view.</EmptyState>
      </Card>
    );
  }

  const dateLabel = new Date(data.fixture.matchDate).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const subtitle = `${dateLabel} · vs ${data.fixture.opponent ?? "TBC"} · auto-fills via SMS`;

  // Group shifts by role for the section headers.
  const grouped = new Map<string, RosterShiftView[]>();
  for (const shift of data.shifts) {
    const list = grouped.get(shift.role) ?? [];
    list.push(shift);
    grouped.set(shift.role, list);
  }

  return (
    <Card span={4}>
      <CardHeader
        title={`Match Day · Rd ${data.fixture.round ?? "?"} Roster`}
        subtitle={subtitle}
        action="Edit roster"
      />
      {grouped.size === 0 ? (
        <EmptyState>No shifts configured for this fixture yet.</EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {Array.from(grouped.entries()).map(([role, shifts]) => (
            <div key={role}>
              <div className="border-b border-wfc-line pb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-wfc-grey">
                {role}
              </div>
              <ul className="divide-y divide-dashed divide-wfc-line">
                {shifts.map((s) => (
                  <li
                    key={s.id}
                    className="grid grid-cols-[1fr_auto] items-center gap-2 py-2 text-[12px]"
                  >
                    <span className="truncate text-wfc-blue-deep">
                      <span className="font-mono text-[10px] text-wfc-grey">{s.slotLabel}</span>
                      {s.assignments.length > 0 ? (
                        <span className="ml-2">{s.assignments.join(", ")}</span>
                      ) : (
                        <em className="ml-2 font-normal italic text-wfc-status-amber">
                          SMS sent · awaiting
                        </em>
                      )}
                    </span>
                    <span className={`h-2 w-2 rounded-full ${STATUS_DOT[s.status]}`} aria-hidden />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
