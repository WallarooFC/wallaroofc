import Link from "next/link";
import { ClipboardList } from "lucide-react";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey">
          Operations
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          Settings
        </h1>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/settings/audit"
          className="group flex items-start gap-4 rounded-lg border border-wfc-line bg-white p-5 transition-colors hover:border-wfc-blue/40"
        >
          <span className="rounded-md bg-wfc-blue/10 p-3 text-wfc-blue-deep">
            <ClipboardList className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block font-serif text-base font-semibold text-wfc-blue-deep">
              Audit log
            </span>
            <span className="mt-1 block text-sm text-wfc-grey">
              Every mutation in the portal — members, jumpers, packs, vouchers, agenda
              edits, mail-merges. Filter by entity, page through history.
            </span>
          </span>
        </Link>
      </section>
    </div>
  );
}
