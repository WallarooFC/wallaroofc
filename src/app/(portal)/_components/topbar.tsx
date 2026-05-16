import { Download, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";

export function Topbar({ breadcrumb }: { breadcrumb: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-wfc-line bg-wfc-cream/80 px-6 backdrop-blur lg:px-10">
      <div className="font-mono text-xs uppercase tracking-[0.16em] text-wfc-grey">
        WFC <span className="mx-1.5 text-wfc-line">/</span>
        <span className="text-wfc-blue-deep">{breadcrumb}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <label className="hidden items-center gap-2 rounded-md border border-wfc-line bg-white px-3 py-2 text-sm text-wfc-grey shadow-[0_1px_2px_rgba(20,49,92,0.04)] md:flex">
          <Search className="h-4 w-4" aria-hidden />
          <input
            className="w-56 bg-transparent outline-none placeholder:text-wfc-grey/70"
            placeholder="Search members, players, sponsors…"
            aria-label="Search"
          />
          <kbd className="rounded border border-wfc-line bg-wfc-cream px-1.5 py-0.5 font-mono text-[10px] text-wfc-grey">
            ⌘K
          </kbd>
        </label>

        <Button variant="secondary" size="md">
          <Download className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Export</span>
        </Button>
        <Button size="md">
          <Plus className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">New record</span>
        </Button>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="md">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
