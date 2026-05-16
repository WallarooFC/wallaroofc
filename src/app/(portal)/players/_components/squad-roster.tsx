import Link from "next/link";
import type { Route } from "next";

import { cn } from "@/lib/utils";
import { SQUAD_LABELS, YEAR_LABELS, isJunior } from "@/lib/db/squads";
import type { PlayerListRow } from "@/lib/db/players";
import type { JumperStatus, Squad } from "@/lib/db/types";

const JUMPER_STATUS_PILL: Record<JumperStatus, string> = {
  pending: "bg-wfc-status-amber/10 text-wfc-status-amber",
  suggested: "bg-wfc-status-amber/10 text-wfc-status-amber",
  confirmed: "bg-wfc-status-green/10 text-wfc-status-green",
  retired: "bg-wfc-grey/15 text-wfc-grey",
};

export function SquadRoster({ squad, players }: { squad: Squad; players: PlayerListRow[] }) {
  const isJnr = isJunior(squad);

  return (
    <section className="rounded-lg border border-wfc-line bg-white">
      <header className="flex items-center justify-between border-b border-wfc-line px-5 py-3">
        <div>
          <h2 className="font-serif text-base font-semibold text-wfc-blue-deep">
            {SQUAD_LABELS[squad]}
          </h2>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-wfc-grey">
            {players.length} player{players.length === 1 ? "" : "s"} ·{" "}
            {players.filter((p) => p.jumper_number !== null).length} numbered
          </p>
        </div>
      </header>

      {players.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-wfc-grey">
          No registered players in this squad yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="bg-wfc-cream/40 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Status</th>
                {isJnr ? (
                  <>
                    <th className="px-4 py-2 font-medium">Year</th>
                    <th className="px-4 py-2 font-medium">DOB</th>
                    <th className="px-4 py-2 font-medium">Guardian</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-2 font-medium">Snr games</th>
                    <th className="px-4 py-2 font-medium">Total games</th>
                    <th className="px-4 py-2 font-medium">Last yr #</th>
                  </>
                )}
                <th className="px-4 py-2 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-t border-wfc-line hover:bg-wfc-cream/30">
                  <td className="px-4 py-2 font-display text-lg leading-none text-wfc-blue-deep">
                    {p.jumper_number ?? <span className="text-wfc-grey">—</span>}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/players/${p.id}` as Route}
                      className="text-wfc-blue-deep hover:text-wfc-red"
                    >
                      {p.first_name} {p.last_name}
                    </Link>
                    {p.member_number ? (
                      <span className="ml-2 font-mono text-[10px] text-wfc-grey">
                        {p.member_number}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
                        JUMPER_STATUS_PILL[p.jumper_status],
                      )}
                    >
                      {p.jumper_status}
                    </span>
                  </td>
                  {isJnr ? (
                    <>
                      <td className="px-4 py-2 text-xs text-wfc-charcoal">
                        {p.year_in_grade ? YEAR_LABELS[p.year_in_grade] : "—"}
                      </td>
                      <td className="px-4 py-2 font-mono text-[11px] text-wfc-grey">
                        {p.dob ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-xs text-wfc-charcoal">
                        {p.guardian_name ? (
                          <>
                            {p.guardian_name}
                            {p.guardian_phone ? (
                              <span className="ml-1 font-mono text-[10px] text-wfc-grey">
                                · {p.guardian_phone}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 font-mono text-[11px] text-wfc-blue-deep">
                        {p.games_played_seniors}
                      </td>
                      <td className="px-4 py-2 font-mono text-[11px] text-wfc-grey">
                        {p.games_played}
                      </td>
                      <td className="px-4 py-2 font-mono text-[11px] text-wfc-grey">
                        {p.last_season_jumper ?? "—"}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-2 text-xs">
                    {p.registered_current_season ? (
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-wfc-status-green">
                        ● Yes
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-wfc-status-amber">
                        ○ Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
