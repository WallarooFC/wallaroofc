import Link from "next/link";
import { notFound } from "next/navigation";

import { getFixture } from "@/lib/db/fixtures";

import { FixtureForm } from "../../_components/fixture-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fixture = await getFixture(id);
  return {
    title: fixture ? `Edit · Rd ${fixture.round_number ?? "?"}` : "Edit fixture",
  };
}

export default async function EditFixturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fixture = await getFixture(id);
  if (!fixture) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href={`/fixtures/${fixture.id}`}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← Round {fixture.round_number ?? "?"}
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          Edit fixture
        </h1>
      </header>
      <FixtureForm fixture={fixture} />
    </div>
  );
}
