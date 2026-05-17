import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getPlayer } from "@/lib/db/players";
import { SQUAD_LABELS, YEAR_LABELS, isJunior } from "@/lib/db/squads";

import { DeletePlayerButton } from "./_components/delete-player-button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = await getPlayer(id);
  return {
    title:
      player && player.first_name
        ? `${player.first_name} ${player.last_name ?? ""}`.trim()
        : "Player",
  };
}

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();

  const isJnr = isJunior(player.squad);
  const fullName = `${player.first_name ?? "Unknown"} ${player.last_name ?? ""}`.trim();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/players"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
          >
            ← Players
          </Link>
          <h1 className="mt-2 flex items-center gap-3 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            {player.jumper_number ? (
              <span className="rounded-md bg-wfc-red/10 px-2.5 py-1 font-display text-2xl leading-none text-wfc-red">
                {player.jumper_number}
              </span>
            ) : null}
            {fullName}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-wfc-grey">
            <span className="rounded-full bg-wfc-blue/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-blue-deep">
              {SQUAD_LABELS[player.squad]}
            </span>
            <span className="rounded-full bg-wfc-line/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
              {player.jumper_status}
            </span>
            {player.member_number ? (
              <span className="font-mono text-[11px]">Member #{player.member_number}</span>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          {player.member_id ? (
            <Link href={`/members/${player.member_id}`}>
              <Button variant="secondary">View member</Button>
            </Link>
          ) : null}
          <Link href={`/players/${player.id}/edit`}>
            <Button variant="secondary">
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          </Link>
          <DeletePlayerButton playerId={player.id} playerName={fullName}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </DeletePlayerButton>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DetailCard title={isJnr ? "Player & guardian" : "Player"}>
          <Detail label="DOB" value={player.dob ?? "—"} mono />
          {isJnr ? (
            <Detail
              label="Year in grade"
              value={player.year_in_grade ? YEAR_LABELS[player.year_in_grade] : "—"}
            />
          ) : (
            <Detail
              label="Position"
              value={player.position_preference ?? "—"}
            />
          )}
          {isJnr ? (
            <>
              <Detail label="Guardian" value={player.guardian_name ?? "—"} />
              <Detail label="Guardian phone" value={player.guardian_phone ?? "—"} mono />
              <Detail
                label="Guardian email"
                value={player.guardian_email ?? "—"}
                mono
                multiline
              />
            </>
          ) : (
            <>
              <Detail label="Senior games" value={String(player.games_played_seniors)} mono />
              <Detail label="Total games" value={String(player.games_played)} mono />
              <Detail
                label="Last season's jumper"
                value={player.last_season_jumper ? String(player.last_season_jumper) : "—"}
                mono
              />
            </>
          )}
        </DetailCard>

        <DetailCard title="Registration & jumper">
          <Detail
            label="PlayHQ registered"
            value={
              player.playhq_registered_at
                ? new Date(player.playhq_registered_at).toLocaleString("en-AU")
                : "—"
            }
            mono
          />
          <Detail
            label="Registered this season"
            value={player.registered_current_season ? "Yes" : "No"}
          />
          <Detail
            label="Created"
            value={new Date(player.created_at).toLocaleString("en-AU")}
            mono
          />
          <Detail
            label="Last updated"
            value={new Date(player.updated_at).toLocaleString("en-AU")}
            mono
          />
        </DetailCard>

        {player.health_flags ? (
          <DetailCard title="Health flags" className="lg:col-span-2">
            <p className="whitespace-pre-line text-sm text-wfc-charcoal">
              {player.health_flags}
            </p>
          </DetailCard>
        ) : null}
      </div>
    </div>
  );
}

function DetailCard({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-lg border border-wfc-line bg-white p-5 ${className ?? ""}`}>
      <h2 className="mb-3 font-serif text-base font-semibold text-wfc-blue-deep">{title}</h2>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Detail({
  label,
  value,
  mono,
  multiline,
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className={multiline ? "sm:col-span-2" : undefined}>
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">{label}</dt>
      <dd
        className={
          mono ? "font-mono text-[12px] text-wfc-blue-deep" : "text-sm text-wfc-charcoal"
        }
      >
        {value}
      </dd>
    </div>
  );
}
