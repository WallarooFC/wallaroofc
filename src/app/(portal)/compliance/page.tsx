import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listCompliance } from "@/lib/db/compliance";

import { ComplianceTable } from "./_components/compliance-table";

export const metadata = { title: "Compliance" };

export default async function CompliancePage() {
  const rows = await listCompliance();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey">
            Governance · registers
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            Compliance
          </h1>
          <p className="mt-1 text-sm text-wfc-grey">
            {rows.length} record{rows.length === 1 ? "" : "s"} · the daily sweep emails
            renewal reminders at 60, 30, 14, 7, and 1 day(s) before expiry.
          </p>
        </div>
        <Link href="/compliance/new">
          <Button size="lg">
            <Plus className="h-4 w-4" aria-hidden />
            New record
          </Button>
        </Link>
      </header>

      <ComplianceTable rows={rows} />
    </div>
  );
}
