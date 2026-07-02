import Link from "next/link";

import { listTemplates } from "@/lib/templates/queries";

import { TakeoverForm } from "./takeover-form";

export const dynamic = "force-dynamic";

export default async function ScheduleTakeoverPage() {
  const templates = await listTemplates({ category: "landing_takeover" }).catch(() => []);

  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-8 px-8 py-12">
      <div>
        <Link
          href="/takeovers"
          className="text-wfc-grey hover:text-wfc-blue-deep text-xs tracking-widest uppercase"
        >
          ← Takeovers
        </Link>
        <h1 className="font-display text-wfc-blue-deep mt-2 text-4xl uppercase">
          Schedule takeover
        </h1>
      </div>
      <TakeoverForm templates={templates} />
    </main>
  );
}
