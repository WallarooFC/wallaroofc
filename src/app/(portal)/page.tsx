import { Suspense } from "react";

import { getAttentionFeed } from "@/lib/attention";
import { getHeroPulse } from "@/lib/db/queries";
import { requireUser } from "@/lib/auth/session";

import { AttentionCard } from "./_components/dashboard/attention-card";
import { AutomationsCard } from "./_components/dashboard/automations-card";
import { ComplianceCard } from "./_components/dashboard/compliance-card";
import { DeadlinesCard } from "./_components/dashboard/deadlines-card";
import { Hero } from "./_components/dashboard/hero";
import { IntegrationsCard } from "./_components/dashboard/integrations-card";
import { MatchDayRosterCard } from "./_components/dashboard/match-day-roster-card";
import { MembershipMixCard } from "./_components/dashboard/membership-mix-card";
import { MilestonesCard } from "./_components/dashboard/milestones-card";
import { PlayHqInboxCard } from "./_components/dashboard/playhq-inbox-card";
import { SponsorPackCard } from "./_components/dashboard/sponsor-pack-card";

export default async function DashboardPage() {
  const user = await requireUser();
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Secretary";
  const firstName = fullName.split(" ")[0] ?? "Secretary";

  const [pulse, attention] = await Promise.all([getHeroPulse(), getAttentionFeed()]);

  return (
    <div className="flex flex-col gap-6">
      <Hero firstName={firstName} pulse={pulse} attentionCount={attention.length} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Suspense fallback={null}>
          <AttentionCard />
        </Suspense>
        <Suspense fallback={null}>
          <MembershipMixCard />
        </Suspense>

        <Suspense fallback={null}>
          <ComplianceCard />
        </Suspense>

        <Suspense fallback={null}>
          <PlayHqInboxCard />
        </Suspense>
        <AutomationsCard />

        <IntegrationsCard />
        <Suspense fallback={null}>
          <DeadlinesCard />
        </Suspense>

        <Suspense fallback={null}>
          <MilestonesCard />
        </Suspense>
        <Suspense fallback={null}>
          <SponsorPackCard />
        </Suspense>
        <Suspense fallback={null}>
          <MatchDayRosterCard />
        </Suspense>
      </div>
    </div>
  );
}
