import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const NAV = [
  {
    href: "/templates",
    title: "Templates",
    body: "Social posts, admin letters, and landing-page takeovers.",
  },
  {
    href: "/takeovers",
    title: "Landing takeovers",
    body: "Schedule a takeover overlay for wallaroofc.com.",
  },
  {
    href: "/comms/preview",
    title: "Letter preview",
    body: "See the fixed WFC letterhead template.",
  },
] as const;

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const greeting = user?.user_metadata?.full_name ?? user?.email ?? "Secretary";

  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-10 px-8 py-16">
      <div>
        <p className="font-headline text-wfc-red text-sm tracking-[0.35em] uppercase">
          Wallaroo Football Club
        </p>
        <h1 className="font-display text-wfc-blue-deep text-6xl leading-[0.95] uppercase sm:text-7xl">
          Morning, {String(greeting).split(" ")[0]}.
        </h1>
        <p className="text-wfc-charcoal mt-4 max-w-2xl font-serif text-lg">
          Full dashboard shell is still to come. Live tools:
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {NAV.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="border-wfc-line hover:border-wfc-red block h-full rounded-lg border bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition"
            >
              <h2 className="font-display text-wfc-blue-deep text-2xl leading-none uppercase">
                {item.title}
              </h2>
              <p className="text-wfc-grey mt-2 font-serif text-sm">{item.body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
