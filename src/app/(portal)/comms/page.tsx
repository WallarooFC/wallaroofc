import { getSegmentSizes } from "@/lib/db/comms";

import { Composer } from "./_components/composer";

export const metadata = { title: "Comms" };

export default async function CommsPage() {
  const sizes = await getSegmentSizes();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey">
          Governance · communications
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          Comms / Mail-merge
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-wfc-grey">
          Pick a segment, write once, the portal sends one personalised email per recipient
          through Resend. Per-send audit row goes into the activity log so committee can see
          who got what and when.
        </p>
      </header>

      <Composer sizes={sizes} />
    </div>
  );
}
