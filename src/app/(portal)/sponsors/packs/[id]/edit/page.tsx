import Link from "next/link";
import { notFound } from "next/navigation";

import {
  currentSeason,
  getSponsorPack,
  listSponsorPicker,
} from "@/lib/db/sponsors";

import { PackForm } from "../../_components/pack-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pack = await getSponsorPack(id);
  return {
    title: pack ? `Edit · ${pack.sponsor_name}` : "Edit sponsor pack",
  };
}

export default async function EditPackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pack, sponsors] = await Promise.all([
    getSponsorPack(id),
    listSponsorPicker(),
  ]);
  if (!pack) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href={`/sponsors/packs/${pack.id}`}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← {pack.sponsor_name}
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          Edit pack
        </h1>
      </header>
      <PackForm pack={pack} sponsors={sponsors} defaultSeason={currentSeason()} />
    </div>
  );
}
