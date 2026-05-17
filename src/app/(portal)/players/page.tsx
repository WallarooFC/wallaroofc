import Link from "next/link";
import { Grid3x3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listPlayers } from "@/lib/db/players";
import { SQUAD_ORDER } from "@/lib/db/squads";
import type { Squad } from "@/lib/db/types";

import { SquadRoster } from "./_components/squad-roster";

export const metadata = { title: "Players & Jumpers" };

export default async function PlayersPage() {
  const players = await listPlayers();

  const grouped = new Map<Squad, typeof players>();
  for (const squad of SQUAD_ORDER) grouped.set(squad, []);
  for (const player of players) grouped.get(player.squad)?.push(player);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey">
            Register · 2026
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            Players &amp; Jumpers
          </h1>
          <p className="mt-1 text-sm text-wfc-grey">
            {players.length} player{players.length === 1 ? "" : "s"} across{" "}
            {SQUAD_ORDER.length} squads ·{" "}
            {players.filter((p) => p.jumper_number !== null).length} numbered.
          </p>
        </div>
        <Link href="/players/jumpers">
          <Button variant="secondary" size="lg">
            <Grid3x3 className="h-4 w-4" aria-hidden />
            Jumper number map
          </Button>
        </Link>
      </header>

      <div className="flex flex-col gap-6">
        {SQUAD_ORDER.map((squad) => (
          <SquadRoster key={squad} squad={squad} players={grouped.get(squad) ?? []} />
        ))}
      </div>
    </div>
  );
}
