import Link from "next/link";

import { listMembersForPicker } from "@/lib/db/compliance";

import { ComplianceForm } from "../_components/compliance-form";

export const metadata = { title: "New compliance record" };

export default async function NewCompliancePage() {
  const members = await listMembersForPicker();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/compliance"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← Compliance
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          New compliance record
        </h1>
      </header>

      <ComplianceForm members={members} />
    </div>
  );
}
