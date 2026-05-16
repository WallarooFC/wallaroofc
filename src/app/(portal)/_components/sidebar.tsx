import Link from "next/link";
import type { Route } from "next";
import {
  Calendar,
  CalendarCheck2,
  FileText,
  Footprints,
  Inbox,
  LayoutGrid,
  Send,
  Shield,
  Ticket,
  Trophy,
  Users,
  Wallet,
  Wine,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type NavItem = {
  href: Route;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: { count: number; tone?: "default" | "warn" };
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      { href: "/" as Route, label: "Dashboard", Icon: LayoutGrid },
      {
        href: "/playhq-inbox" as Route,
        label: "PlayHQ Inbox",
        Icon: Inbox,
      },
    ],
  },
  {
    label: "Register",
    items: [
      { href: "/members" as Route, label: "Members", Icon: Users },
      { href: "/players" as Route, label: "Players & Jumpers", Icon: Footprints },
      { href: "/milestones" as Route, label: "Milestones", Icon: Trophy },
      { href: "/sponsors" as Route, label: "Sponsors & Packs", Icon: Wallet },
    ],
  },
  {
    label: "Match Day",
    items: [
      { href: "/fixtures" as Route, label: "Fixtures", Icon: Calendar },
      { href: "/rosters" as Route, label: "Rosters", Icon: CalendarCheck2 },
      { href: "/bar-bulldogs" as Route, label: "Bar & Bulldogs $", Icon: Wine },
      { href: "/gate" as Route, label: "Gate Takings", Icon: Ticket },
    ],
  },
  {
    label: "Governance",
    items: [
      { href: "/agendas" as Route, label: "Agendas & Minutes", Icon: FileText },
      { href: "/compliance" as Route, label: "Compliance", Icon: Shield },
      { href: "/comms" as Route, label: "Comms / Mail-merge", Icon: Send },
    ],
  },
];

export function Sidebar({
  pathname,
  user,
}: {
  pathname: string;
  user: { fullName: string; role: string };
}) {
  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="sticky top-0 hidden h-screen w-[256px] shrink-0 flex-col gap-6 overflow-y-auto border-r-4 border-wfc-red bg-wfc-blue-deep px-5 py-6 text-wfc-cream lg:flex">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md border border-wfc-cream/25 bg-wfc-blue-darkest/60 font-headline text-xl tracking-widest">
          W
        </div>
        <div>
          <div className="font-headline text-base tracking-[0.18em]">WALLAROO FC</div>
          <div className="font-serif text-xs italic text-wfc-cream/75">Secretary&apos;s Hub</div>
        </div>
      </div>

      <nav className="flex flex-col gap-5">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-wfc-cream/55">
              {section.label}
            </div>
            <ul className="flex flex-col gap-px">
              {section.items.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={[
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "border-l-2 border-wfc-red bg-wfc-blue/40 pl-[10px] text-wfc-cream"
                          : "text-wfc-cream/75 hover:bg-wfc-blue/30 hover:text-wfc-cream",
                      ].join(" ")}
                    >
                      <item.Icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <span
                          className={[
                            "rounded-full px-1.5 py-0.5 font-mono text-[10px]",
                            item.badge.tone === "warn"
                              ? "bg-wfc-status-amber/20 text-wfc-status-amber"
                              : "bg-wfc-red/20 text-wfc-cream",
                          ].join(" ")}
                        >
                          {item.badge.count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-wfc-cream/15 pt-4">
        <div className="font-mono text-[10px] tracking-[0.18em] text-wfc-cream/55">
          SEASON 2026 · ROUND 04
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-wfc-cream/30 bg-wfc-blue-darkest/60 font-mono text-xs">
            {initials || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs text-wfc-cream">{user.fullName}</div>
            <div className="truncate text-[10px] text-wfc-cream/55">
              {user.role[0]?.toUpperCase()}
              {user.role.slice(1)}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
