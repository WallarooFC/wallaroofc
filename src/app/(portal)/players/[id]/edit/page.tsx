import Link from "next/link";
import { notFound } from "next/navigation";

import { getPlayer } from "@/lib/db/players";

import { PlayerForm } from "../../_components/player-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = await getPlayer(id);
  const name =
    player && player.first_name
      ? `${player.first_name} ${player.last_name ?? ""}`.trim()
      : "player";
  return { title: `Edit · ${name}` };
}

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();

  const fullName = `${player.first_name ?? "Unknown"} ${player.last_name ?? ""}`.trim();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href={`/players/${player.id}`}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← {fullName}
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          Edit player
        </h1>
      </header>

      <PlayerForm player={player} />
    </div>
  );
}
