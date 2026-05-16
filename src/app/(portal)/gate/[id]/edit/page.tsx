import Link from "next/link";
import { notFound } from "next/navigation";

import { getGateTakings, listFixturesForGate } from "@/lib/db/gate";

import { GateForm } from "../../_components/gate-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await getGateTakings(id);
  return { title: entry ? `Edit gate takings` : "Edit" };
}

export default async function EditGateTakingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [entry, fixtures] = await Promise.all([
    getGateTakings(id),
    listFixturesForGate(),
  ]);
  if (!entry) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href={`/gate/${entry.id}`}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← {entry.fixture_label ?? "Standalone entry"}
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          Edit gate takings
        </h1>
      </header>
      <GateForm entry={entry} fixtures={fixtures} />
    </div>
  );
}
