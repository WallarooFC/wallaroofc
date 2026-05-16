import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  MILESTONE_STATUS_LABEL,
  MILESTONE_STATUS_PILL,
  MILESTONE_TYPE_LABEL,
} from "@/lib/db/milestone-types";
import { getMilestone } from "@/lib/db/milestones";
import { SQUAD_LABELS } from "@/lib/db/squads";

import { DeleteMilestoneButton } from "./_components/delete-milestone-button";
import { FlagToggle } from "./_components/flag-toggle";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await getMilestone(id);
  return {
    title: m ? `${m.target_game_count ?? "Milestone"} · ${m.player_name}` : "Milestone",
  };
}

export default async function MilestoneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const milestone = await getMilestone(id);
  if (!milestone) notFound();

  const remaining =
    milestone.target_game_count !== null
      ? milestone.target_game_count - milestone.games_played_seniors
      : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/milestones"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
          >
            ← Milestones
          </Link>
          <h1 className="mt-2 flex items-center gap-3 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            {milestone.target_game_count ? (
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full font-display text-base text-wfc-blue-deep shadow-[0_2px_6px_rgba(0,0,0,0.16)]"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, #f1e3c7, #c89a4a 65%, #7a5a2a)",
                }}
              >
                {milestone.target_game_count}
              </span>
            ) : null}
            {milestone.player_name}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-wfc-grey">
            {milestone.squad ? (
              <span className="rounded-full bg-wfc-blue/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-blue-deep">
                {SQUAD_LABELS[milestone.squad]}
              </span>
            ) : null}
            {milestone.milestone_type ? (
              <span className="rounded-full bg-wfc-line/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
                {MILESTONE_TYPE_LABEL[milestone.milestone_type]}
              </span>
            ) : null}
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${MILESTONE_STATUS_PILL[milestone.status]}`}
            >
              {MILESTONE_STATUS_LABEL[milestone.status]}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {milestone.player_id ? (
            <Link href={`/players/${milestone.player_id}`}>
              <Button variant="secondary">View player</Button>
            </Link>
          ) : null}
          <Link href={`/milestones/${milestone.id}/edit`}>
            <Button variant="secondary">
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          </Link>
          <DeleteMilestoneButton milestoneId={milestone.id}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </DeleteMilestoneButton>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-wfc-line bg-white p-5">
          <h2 className="mb-3 font-serif text-base font-semibold text-wfc-blue-deep">
            Progress
          </h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Detail
              label="Senior games"
              value={String(milestone.games_played_seniors)}
              mono
            />
            <Detail
              label="Remaining"
              value={
                remaining === null
                  ? "—"
                  : remaining <= 0
                    ? "Reached"
                    : `${remaining} game${remaining === 1 ? "" : "s"}`
              }
              mono
            />
            <Detail
              label="Projected fixture"
              value={milestone.fixture_label ?? "TBC"}
              multiline
            />
            <Detail
              label="Projected date"
              value={
                milestone.fixture_date
                  ? new Date(milestone.fixture_date).toLocaleDateString("en-AU", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"
              }
              mono
            />
          </dl>
        </section>

        <section className="rounded-lg border border-wfc-line bg-white p-5">
          <h2 className="mb-3 font-serif text-base font-semibold text-wfc-blue-deep">
            Checklist
          </h2>
          <ul className="flex flex-col gap-2">
            <li>
              <FlagToggle
                milestoneId={milestone.id}
                field="jumper_ordered"
                checked={milestone.jumper_ordered}
                label="Milestone jumper ordered"
                description="With name + number stitched."
              />
            </li>
            <li>
              <FlagToggle
                milestoneId={milestone.id}
                field="presentation_planned"
                checked={milestone.presentation_planned}
                label="Presentation planned"
                description="Guard of honour, speeches, framed jumper."
              />
            </li>
            <li>
              <FlagToggle
                milestoneId={milestone.id}
                field="media_release_sent"
                checked={milestone.media_release_sent}
                label="Media release sent"
                description="Yorke Peninsula Country Times + socials."
              />
            </li>
          </ul>
        </section>

        {milestone.notes ? (
          <section className="rounded-lg border border-wfc-line bg-white p-5 lg:col-span-2">
            <h2 className="mb-3 font-serif text-base font-semibold text-wfc-blue-deep">
              Notes
            </h2>
            <p className="whitespace-pre-line text-sm text-wfc-charcoal">
              {milestone.notes}
            </p>
          </section>
        ) : null}
      </div>
    </div>
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
      <dd className={mono ? "font-mono text-[12px] text-wfc-blue-deep" : "text-sm text-wfc-charcoal"}>
        {value}
      </dd>
    </div>
  );
}
