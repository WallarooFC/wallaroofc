import { headers } from "next/headers";
import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth/session";

import { Sidebar } from "./_components/sidebar";
import { Topbar } from "./_components/topbar";
import { ArchitectureStrip } from "./_components/architecture-strip";

const BREADCRUMBS: Array<{ prefix: string; label: string }> = [
  { prefix: "/playhq-inbox", label: "PlayHQ Inbox" },
  { prefix: "/members", label: "Members" },
  { prefix: "/players", label: "Players" },
  { prefix: "/milestones", label: "Milestones" },
  { prefix: "/sponsors", label: "Sponsors" },
  { prefix: "/fixtures", label: "Fixtures" },
  { prefix: "/rosters", label: "Rosters" },
  { prefix: "/bar-bulldogs", label: "Bar & Bulldogs $" },
  { prefix: "/gate", label: "Gate" },
  { prefix: "/compliance", label: "Compliance" },
  { prefix: "/agendas", label: "Agendas" },
  { prefix: "/comms", label: "Comms" },
  { prefix: "/settings", label: "Settings" },
];

function breadcrumbFor(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  const match = BREADCRUMBS.find((b) => pathname.startsWith(b.prefix));
  return match?.label ?? "Dashboard";
}

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Secretary";
  const role = (user.user_metadata?.role as string | undefined) ?? "secretary";

  // Pathname is exposed by Next via x-pathname / x-invoke-path headers.
  // Falling back to "/" keeps the layout robust if neither is present.
  const hdrs = await headers();
  const pathname =
    hdrs.get("x-pathname") ?? hdrs.get("x-invoke-path") ?? hdrs.get("next-url") ?? "/";

  return (
    <div className="flex min-h-screen bg-wfc-cream">
      <Sidebar pathname={pathname} user={{ fullName, role }} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar breadcrumb={breadcrumbFor(pathname)} />
        <main className="flex-1 px-6 py-6 lg:px-10 lg:py-8">{children}</main>
        <ArchitectureStrip />
      </div>
    </div>
  );
}
