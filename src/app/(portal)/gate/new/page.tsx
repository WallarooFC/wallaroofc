import Link from "next/link";

import { listFixturesForGate } from "@/lib/db/gate";

import { GateForm } from "../_components/gate-form";

export const metadata = { title: "Record gate takings" };

export default async function NewGateTakingsPage() {
  const fixtures = await listFixturesForGate();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/gate"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← Gate takings
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          Record takings
        </h1>
      </header>
      <GateForm fixtures={fixtures} />
    </div>
  );
}
