import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

/**
 * Public JSON feed consumed by wallaroofc.com.au. No auth -- everything
 * exposed here is intentionally public (fixture list, current sponsors).
 *
 * Service-role bypasses RLS deliberately so the public site doesn't need
 * a privileged token; we control exposure by deciding what to select.
 */

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 minutes
export const runtime = "nodejs";

type FixtureShape = {
  id: string;
  round_number: number | null;
  match_date: string;
  home_away: "home" | "away" | null;
  opponent: string | null;
  venue: string | null;
  grade: string | null;
};

type SponsorShape = {
  id: string;
  first_name: string;
  last_name: string;
  member_type: string;
};

export async function GET() {
  const supabase = createSupabaseServiceRoleClient();
  const today = new Date().toISOString().slice(0, 10);

  const [fixturesRes, sponsorsRes] = await Promise.all([
    supabase
      .from("fixtures")
      .select("id, round_number, match_date, home_away, opponent, venue, grade")
      .gte("match_date", today)
      .order("match_date", { ascending: true })
      .limit(30),
    supabase
      .from("members")
      .select("id, first_name, last_name, member_type")
      .in("member_type", ["gold_sponsor", "silver_sponsor", "bronze_sponsor"])
      .order("member_type", { ascending: true })
      .order("last_name", { ascending: true }),
  ]);

  const fixtures = (fixturesRes.data ?? []) as unknown as FixtureShape[];
  const sponsors = (sponsorsRes.data ?? []) as unknown as SponsorShape[];

  return NextResponse.json(
    {
      generated_at: new Date().toISOString(),
      fixtures: fixtures.map((f) => ({
        id: f.id,
        round: f.round_number,
        date: f.match_date,
        home_away: f.home_away,
        opponent: f.opponent,
        venue: f.venue,
        grade: f.grade,
      })),
      sponsors: sponsors.map((s) => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        tier: s.member_type.replace("_sponsor", ""),
      })),
    },
    {
      headers: {
        "cache-control": "public, max-age=60, s-maxage=300",
      },
    },
  );
}
