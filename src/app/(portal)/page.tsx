import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const greeting = user?.user_metadata?.full_name ?? user?.email ?? "Secretary";

  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-6 px-8 py-20">
      <p className="font-headline text-wfc-red text-sm tracking-[0.35em] uppercase">
        Wallaroo Football Club
      </p>
      <h1 className="font-display text-wfc-blue-deep text-6xl leading-[0.95] uppercase sm:text-7xl">
        Morning, {String(greeting).split(" ")[0]}.
      </h1>
      <p className="text-wfc-charcoal max-w-2xl font-serif text-lg">
        Dashboard cards land in commit 3. Authenticated routes, magic-link sign-in, and the
        Microsoft OAuth handshake are wired up — the rest of the secretary&apos;s tools follow the
        build order in
        <code className="bg-wfc-blue-deep/10 ml-1 rounded px-1.5 py-0.5 font-mono text-xs">
          reference/CLAUDE_CODE_PROMPT.md
        </code>
        .
      </p>
    </main>
  );
}
