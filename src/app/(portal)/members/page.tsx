import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listMembers } from "@/lib/db/members";

import { MembersTable } from "./_components/members-table";

export const metadata = { title: "Members" };

export default async function MembersPage() {
  const rows = await listMembers();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey">
            Register · 2026
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            Members
          </h1>
          <p className="mt-1 text-sm text-wfc-grey">
            {rows.length} on the books · filter, search, click in for the detail.
          </p>
        </div>
        <Link href="/members/new">
          <Button size="lg">
            <Plus className="h-4 w-4" aria-hidden />
            New member
          </Button>
        </Link>
      </header>

      <MembersTable rows={rows} />
    </div>
  );
}
