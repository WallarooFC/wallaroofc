import Link from "next/link";

import { FixtureForm } from "../_components/fixture-form";

export const metadata = { title: "New fixture" };

export default function NewFixturePage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/fixtures"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← Fixtures
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          New fixture
        </h1>
      </header>
      <FixtureForm />
    </div>
  );
}
