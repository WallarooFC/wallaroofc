import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getMilestone,
  listFixturesForMilestone,
  listPlayersForMilestone,
} from "@/lib/db/milestones";

import { MilestoneForm } from "../../_components/milestone-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await getMilestone(id);
  return { title: m ? `Edit · ${m.player_name}` : "Edit milestone" };
}

export default async function EditMilestonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [milestone, players, fixtures] = await Promise.all([
    getMilestone(id),
    listPlayersForMilestone(),
    listFixturesForMilestone(),
  ]);
  if (!milestone) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href={`/milestones/${milestone.id}`}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← {milestone.player_name}
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          Edit milestone
        </h1>
      </header>
      <MilestoneForm milestone={milestone} players={players} fixtures={fixtures} />
    </div>
  );
}
