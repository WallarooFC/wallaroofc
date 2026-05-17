import Link from "next/link";

import { currentSeason, listSponsorPicker } from "@/lib/db/sponsors";

import { PackForm } from "../_components/pack-form";

export const metadata = { title: "New sponsor pack" };

export default async function NewSponsorPackPage() {
  const sponsors = await listSponsorPicker();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/sponsors/packs"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← Pack tracker
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          New sponsor pack
        </h1>
      </header>
      <PackForm sponsors={sponsors} defaultSeason={currentSeason()} />
    </div>
  );
}
