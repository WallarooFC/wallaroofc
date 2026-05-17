import Link from "next/link";

import {
  listFixturesForMilestone,
  listPlayersForMilestone,
} from "@/lib/db/milestones";

import { MilestoneForm } from "../_components/milestone-form";

export const metadata = { title: "New milestone" };

export default async function NewMilestonePage() {
  const [players, fixtures] = await Promise.all([
    listPlayersForMilestone(),
    listFixturesForMilestone(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/milestones"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← Milestones
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          New milestone
        </h1>
      </header>
      <MilestoneForm players={players} fixtures={fixtures} />
    </div>
  );
}
