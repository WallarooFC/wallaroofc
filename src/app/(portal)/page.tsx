import { signOut } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await requireUser();
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Secretary";

  return (
    <main className="mx-auto flex min-h-screen max-w-[1400px] flex-col items-start gap-6 px-8 py-20">
      <p className="font-headline text-wfc-red text-sm tracking-[0.35em] uppercase">
        Wallaroo Football Club
      </p>
      <h1 className="font-display text-wfc-blue-deep text-6xl leading-[0.95] uppercase sm:text-7xl">
        Morning, {displayName.split(" ")[0]}.
      </h1>
      <p className="text-wfc-charcoal max-w-2xl font-serif text-lg">
        Dashboard arrives in the next commit. Auth and the protected route group are live; the
        ledger pages, attention feed, and PlayHQ inbox plug in once schema + seed land.
      </p>

      <form action={signOut}>
        <Button type="submit" variant="secondary">
          Sign out
        </Button>
      </form>
    </main>
  );
}
