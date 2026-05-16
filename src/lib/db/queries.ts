import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MemberType, SponsorPackStatus, Squad } from "@/lib/db/types";

/**
 * supabase-js v2.105 parses column-list select strings into `never` against
 * our hand-written Database shape, so each query casts the response to a
 * locally-declared row shape. The cast is explicit (via `as unknown as`),
 * keeps the call sites readable, and lets every card render against real
 * data once a Supabase project is wired up.
 */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[queries]", (err as Error).message);
    }
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Hero pulse strip — five top-line numbers.
// ---------------------------------------------------------------------------
export type HeroPulse = {
  members: number;
  players: { total: number; numbered: number };
  pendingAllocations: number;
  gateTakingsYtd: number;
  bulldogsOutstanding: number;
};

type GateRow = { cash_amount: string | null; eftpos_amount: string | null };
type VoucherRow = {
  amount_aud: string | null;
  redeemed_amount: string | null;
  redeemed_at: string | null;
};

export async function getHeroPulse(): Promise<HeroPulse> {
  return safe(
    async () => {
      const supabase = await createSupabaseServerClient();

      const [members, players, numbered, queue, gate, vouchers] = await Promise.all([
        supabase.from("members").select("*", { count: "exact", head: true }),
        supabase.from("players").select("*", { count: "exact", head: true }),
        supabase
          .from("players")
          .select("*", { count: "exact", head: true })
          .not("jumper_number", "is", null),
        supabase
          .from("jumper_allocation_queue")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase.from("gate_takings").select("cash_amount, eftpos_amount"),
        supabase
          .from("bulldogs_dollars")
          .select("amount_aud, redeemed_amount, redeemed_at"),
      ]);

      const gateRows = (gate.data ?? []) as unknown as GateRow[];
      const voucherRows = (vouchers.data ?? []) as unknown as VoucherRow[];

      const gateYtd = gateRows.reduce(
        (sum, row) => sum + Number(row.cash_amount ?? 0) + Number(row.eftpos_amount ?? 0),
        0,
      );
      const outstanding = voucherRows.reduce((sum, row) => {
        const issued = Number(row.amount_aud ?? 0);
        const redeemed = row.redeemed_at
          ? Number(row.redeemed_amount ?? row.amount_aud ?? 0)
          : 0;
        return sum + (issued - redeemed);
      }, 0);

      return {
        members: members.count ?? 0,
        players: { total: players.count ?? 0, numbered: numbered.count ?? 0 },
        pendingAllocations: queue.count ?? 0,
        gateTakingsYtd: gateYtd,
        bulldogsOutstanding: outstanding,
      };
    },
    {
      members: 0,
      players: { total: 0, numbered: 0 },
      pendingAllocations: 0,
      gateTakingsYtd: 0,
      bulldogsOutstanding: 0,
    },
  );
}

// ---------------------------------------------------------------------------
// Membership mix.
// ---------------------------------------------------------------------------
export type MembershipBucket = {
  key: "life" | "playing" | "sponsor" | "vip" | "other";
  label: string;
  count: number;
  cssVar: string;
};
export type MembershipMix = {
  total: number;
  buckets: MembershipBucket[];
  postal: number;
  email: number;
  unpaid: number;
};

const TYPE_TO_BUCKET: Record<MemberType, MembershipBucket["key"]> = {
  life: "life",
  senior: "playing",
  junior: "playing",
  gold_sponsor: "sponsor",
  silver_sponsor: "sponsor",
  bronze_sponsor: "sponsor",
  vip: "vip",
  honorary: "other",
  other: "other",
};

type MemberRow = {
  member_type: MemberType;
  email: string | null;
  postal_address: string | null;
  paid_current_season: boolean;
};

export async function getMembershipMix(): Promise<MembershipMix> {
  return safe(
    async () => {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase
        .from("members")
        .select("member_type, email, postal_address, paid_current_season");

      const rows = (data ?? []) as unknown as MemberRow[];

      const counts: Record<MembershipBucket["key"], number> = {
        life: 0,
        playing: 0,
        sponsor: 0,
        vip: 0,
        other: 0,
      };

      let total = 0;
      let postal = 0;
      let email = 0;
      let unpaid = 0;
      for (const row of rows) {
        total += 1;
        const bucket = TYPE_TO_BUCKET[row.member_type] ?? "other";
        counts[bucket] += 1;
        if (row.email) email += 1;
        if (row.postal_address) postal += 1;
        if (!row.paid_current_season) unpaid += 1;
      }
      const buckets: MembershipBucket[] = [
        { key: "life", label: "Life Members", count: counts.life, cssVar: "var(--color-wfc-blue-deep)" },
        { key: "playing", label: "Senior / Junior", count: counts.playing, cssVar: "var(--color-wfc-blue)" },
        { key: "sponsor", label: "Gold / Silver / Bronze", count: counts.sponsor, cssVar: "var(--color-wfc-red)" },
        { key: "vip", label: "VIP", count: counts.vip, cssVar: "var(--color-wfc-status-green)" },
        { key: "other", label: "Other / Honorary", count: counts.other, cssVar: "var(--color-wfc-grey)" },
      ];
      return { total, buckets, postal, email, unpaid };
    },
    {
      total: 0,
      buckets: [
        { key: "life", label: "Life Members", count: 0, cssVar: "var(--color-wfc-blue-deep)" },
        { key: "playing", label: "Senior / Junior", count: 0, cssVar: "var(--color-wfc-blue)" },
        { key: "sponsor", label: "Gold / Silver / Bronze", count: 0, cssVar: "var(--color-wfc-red)" },
        { key: "vip", label: "VIP", count: 0, cssVar: "var(--color-wfc-status-green)" },
        { key: "other", label: "Other / Honorary", count: 0, cssVar: "var(--color-wfc-grey)" },
      ],
      postal: 0,
      email: 0,
      unpaid: 0,
    },
  );
}

// ---------------------------------------------------------------------------
// Compliance snapshot.
// ---------------------------------------------------------------------------
export type ComplianceTile = {
  key: "wwcc" | "trainer" | "first_aid" | "rsa";
  label: string;
  valid: number;
  total: number;
  expiringSoon: number;
  expired: number;
  targetCopy: string;
};

type ComplianceRow = { cert_type: string; expiry_date: string | null };

export async function getComplianceTiles(): Promise<ComplianceTile[]> {
  return safe(
    async () => {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase.from("compliance_records").select("cert_type, expiry_date");
      const rows = (data ?? []) as unknown as ComplianceRow[];

      const today = new Date();
      const thirty = new Date(today.getTime() + 30 * 86400_000);

      const groups = new Map<string, { valid: number; total: number; soon: number; expired: number }>();
      for (const row of rows) {
        const cert = row.cert_type;
        const g = groups.get(cert) ?? { valid: 0, total: 0, soon: 0, expired: 0 };
        g.total += 1;
        if (row.expiry_date) {
          const expiry = new Date(row.expiry_date);
          if (expiry < today) g.expired += 1;
          else {
            g.valid += 1;
            if (expiry <= thirty) g.soon += 1;
          }
        } else {
          g.valid += 1;
        }
        groups.set(cert, g);
      }

      const trainer = ["trainer_level_0", "trainer_level_1", "trainer_level_2"].reduce(
        (acc, key) => {
          const g = groups.get(key);
          if (!g) return acc;
          return {
            valid: acc.valid + g.valid,
            total: acc.total + g.total,
            soon: acc.soon + g.soon,
            expired: acc.expired + g.expired,
          };
        },
        { valid: 0, total: 0, soon: 0, expired: 0 },
      );
      const wwcc = groups.get("wwcc") ?? { valid: 0, total: 0, soon: 0, expired: 0 };
      const firstAid = groups.get("first_aid") ?? { valid: 0, total: 0, soon: 0, expired: 0 };
      const rsa = groups.get("rsa") ?? { valid: 0, total: 0, soon: 0, expired: 0 };

      return [
        {
          key: "wwcc",
          label: "WWCC",
          valid: wwcc.valid,
          total: wwcc.total,
          expiringSoon: wwcc.soon,
          expired: wwcc.expired,
          targetCopy: "all coaching staff",
        },
        {
          key: "trainer",
          label: "Trainer Accreditation",
          valid: trainer.valid,
          total: Math.max(trainer.total, 6),
          expiringSoon: trainer.soon,
          expired: trainer.expired,
          targetCopy: "of 6 Level-1+",
        },
        {
          key: "first_aid",
          label: "First Aid Cert",
          valid: firstAid.valid,
          total: firstAid.total,
          expiringSoon: firstAid.soon,
          expired: firstAid.expired,
          targetCopy: "need ≥2 by R5",
        },
        {
          key: "rsa",
          label: "RSA Holders",
          valid: rsa.valid,
          total: rsa.total,
          expiringSoon: rsa.soon,
          expired: rsa.expired,
          targetCopy: "need ≥3 for bar",
        },
      ];
    },
    [
      { key: "wwcc", label: "WWCC", valid: 0, total: 0, expiringSoon: 0, expired: 0, targetCopy: "all coaching staff" },
      { key: "trainer", label: "Trainer Accreditation", valid: 0, total: 6, expiringSoon: 0, expired: 0, targetCopy: "of 6 Level-1+" },
      { key: "first_aid", label: "First Aid Cert", valid: 0, total: 0, expiringSoon: 0, expired: 0, targetCopy: "need ≥2 by R5" },
      { key: "rsa", label: "RSA Holders", valid: 0, total: 0, expiringSoon: 0, expired: 0, targetCopy: "need ≥3 for bar" },
    ],
  );
}

// ---------------------------------------------------------------------------
// PlayHQ inbox.
// ---------------------------------------------------------------------------
export type InboxRow = {
  id: string;
  status: "pending" | "allocated";
  playerName: string;
  initials: string;
  squad: Squad | null;
  receivedAt: string | null;
  memberNumber: string | null;
  jumperNumber: number | null;
  suggestedNumber: number | null;
  suggestedReason: string | null;
};

export type PlayHqInbox = {
  pending: InboxRow[];
  allocated: InboxRow[];
  squadCounts: Record<Squad, number>;
};

const EMPTY_SQUAD_COUNTS: Record<Squad, number> = {
  seniors: 0,
  reserves: 0,
  snr_colts: 0,
  jnr_colts: 0,
  u11s: 0,
  u9s: 0,
};

type QueueRowShape = {
  id: string;
  status: string;
  received_at: string | null;
  suggested_number: number | null;
  suggested_reason: string | null;
  players: {
    squad: Squad;
    jumper_number: number | null;
    members: { first_name: string; last_name: string; member_number: string | null } | null;
  } | null;
};

type PlayerSquadRow = { squad: Squad };

export async function getPlayHqInbox(): Promise<PlayHqInbox> {
  return safe(
    async () => {
      const supabase = await createSupabaseServerClient();
      const [queue, squadGroups] = await Promise.all([
        supabase
          .from("jumper_allocation_queue")
          .select(
            "id, status, received_at, suggested_number, suggested_reason, players(squad, jumper_number, members(first_name, last_name, member_number))",
          )
          .in("status", ["pending", "allocated"])
          .order("received_at", { ascending: false })
          .limit(15),
        supabase.from("players").select("squad"),
      ]);

      const queueRows = (queue.data ?? []) as unknown as QueueRowShape[];
      const playerRows = (squadGroups.data ?? []) as unknown as PlayerSquadRow[];

      const squadCounts = { ...EMPTY_SQUAD_COUNTS };
      for (const row of playerRows) {
        squadCounts[row.squad] = (squadCounts[row.squad] ?? 0) + 1;
      }

      const toRow = (row: QueueRowShape): InboxRow => {
        const player = row.players;
        const member = player?.members ?? null;
        const playerName = member ? `${member.first_name} ${member.last_name}` : "(unknown)";
        const initials = playerName
          .split(" ")
          .map((p) => p[0] ?? "")
          .join("")
          .slice(0, 2)
          .toUpperCase();
        return {
          id: row.id,
          status: row.status === "allocated" ? "allocated" : "pending",
          playerName,
          initials,
          squad: player?.squad ?? null,
          receivedAt: row.received_at,
          memberNumber: member?.member_number ?? null,
          jumperNumber: player?.jumper_number ?? null,
          suggestedNumber: row.suggested_number,
          suggestedReason: row.suggested_reason,
        };
      };

      const rows = queueRows.map(toRow);
      return {
        pending: rows.filter((r) => r.status === "pending"),
        allocated: rows.filter((r) => r.status === "allocated"),
        squadCounts,
      };
    },
    { pending: [], allocated: [], squadCounts: { ...EMPTY_SQUAD_COUNTS } },
  );
}

// ---------------------------------------------------------------------------
// Upcoming deadlines.
// ---------------------------------------------------------------------------
export type DeadlineRow = {
  id: string;
  date: string;
  title: string;
  tag: string;
};

type ComplianceDeadlineShape = {
  id: string;
  expiry_date: string | null;
  cert_type: string;
  members: { first_name: string; last_name: string } | null;
};
type FixtureShape = {
  id: string;
  match_date: string;
  opponent: string | null;
  round_number: number | null;
};
type AgendaShape = { id: string; meeting_date: string; meeting_type: string };

export async function getUpcomingDeadlines(limit = 6): Promise<DeadlineRow[]> {
  return safe(
    async () => {
      const supabase = await createSupabaseServerClient();
      const today = new Date().toISOString().slice(0, 10);
      const [compliance, fixtures, agendas] = await Promise.all([
        supabase
          .from("compliance_records")
          .select("id, expiry_date, cert_type, members(first_name, last_name)")
          .gte("expiry_date", today)
          .order("expiry_date", { ascending: true })
          .limit(20),
        supabase
          .from("fixtures")
          .select("id, match_date, opponent, round_number")
          .gte("match_date", today)
          .order("match_date", { ascending: true })
          .limit(5),
        supabase
          .from("agendas")
          .select("id, meeting_date, meeting_type")
          .gte("meeting_date", today)
          .order("meeting_date", { ascending: true })
          .limit(5),
      ]);

      const complianceRows = (compliance.data ?? []) as unknown as ComplianceDeadlineShape[];
      const fixtureRows = (fixtures.data ?? []) as unknown as FixtureShape[];
      const agendaRows = (agendas.data ?? []) as unknown as AgendaShape[];

      const rows: DeadlineRow[] = [];
      for (const row of complianceRows) {
        if (!row.expiry_date) continue;
        const member = row.members;
        const initials = member
          ? `${member.first_name[0] ?? ""}. ${member.last_name}`
          : "Member";
        rows.push({
          id: `comp-${row.id}`,
          date: row.expiry_date,
          title: `${initials} — ${row.cert_type.replace("_", " ").toUpperCase()} expires`,
          tag: `Compliance · ${row.cert_type.replace("_", " ")}`,
        });
      }
      for (const row of fixtureRows) {
        rows.push({
          id: `fix-${row.id}`,
          date: row.match_date,
          title: `Round ${row.round_number ?? "?"} team sheets · vs ${row.opponent ?? "TBC"}`,
          tag: "League · weekly",
        });
      }
      for (const row of agendaRows) {
        rows.push({
          id: `agenda-${row.id}`,
          date: row.meeting_date,
          title: `${row.meeting_type.replace("_", " ")} meeting — minutes & agenda`,
          tag: `Governance · ${row.meeting_type.replace("_", " ")}`,
        });
      }
      rows.sort((a, b) => (a.date < b.date ? -1 : 1));
      return rows.slice(0, limit);
    },
    [],
  );
}

// ---------------------------------------------------------------------------
// Milestone cards.
// ---------------------------------------------------------------------------
export type MilestoneCard = {
  id: string;
  playerName: string;
  squad: Squad | null;
  matchLabel: string | null;
  matchDate: string | null;
  targetGames: number | null;
};

type MilestoneShape = {
  id: string;
  target_game_count: number | null;
  status: string;
  players: { squad: Squad; members: { first_name: string; last_name: string } | null } | null;
  fixtures: { match_date: string; opponent: string | null; round_number: number | null } | null;
};

export async function getMilestoneCards(limit = 4): Promise<MilestoneCard[]> {
  return safe(
    async () => {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase
        .from("milestones")
        .select(
          "id, target_game_count, status, players(squad, members(first_name, last_name)), fixtures:projected_fixture_id(match_date, opponent, round_number)",
        )
        .in("status", ["upcoming", "imminent"])
        .limit(limit);

      const rows = (data ?? []) as unknown as MilestoneShape[];
      return rows.map((row) => {
        const player = row.players;
        const fixture = row.fixtures;
        const playerName = player?.members
          ? `${player.members.first_name} ${player.members.last_name}`
          : "(player)";
        const matchLabel = fixture
          ? `Rd ${fixture.round_number ?? "?"} vs ${fixture.opponent ?? "TBC"}`
          : null;
        return {
          id: row.id,
          playerName,
          squad: player?.squad ?? null,
          matchLabel,
          matchDate: fixture?.match_date ?? null,
          targetGames: row.target_game_count,
        };
      });
    },
    [],
  );
}

// ---------------------------------------------------------------------------
// Sponsor pack tracker.
// ---------------------------------------------------------------------------
export type SponsorPackRow = {
  id: string;
  sponsorName: string;
  tier: string;
  status: SponsorPackStatus;
  detail: string;
};

export type SponsorPackSummary = {
  delivered: number;
  built: number;
  overdue: number;
  recent: SponsorPackRow[];
};

const TIER_LABELS: Record<MemberType, string> = {
  gold_sponsor: "Gold",
  silver_sponsor: "Silver",
  bronze_sponsor: "Bronze",
  life: "Life",
  senior: "Senior",
  junior: "Junior",
  vip: "VIP",
  honorary: "Honorary",
  other: "Other",
};

type PackShape = {
  id: string;
  pack_status: SponsorPackStatus;
  scheduled_delivery: string | null;
  delivered_at: string | null;
  contents: Array<{ item: string; qty: number }> | null;
  members: { first_name: string; last_name: string; member_type: MemberType } | null;
};

export async function getSponsorPackSummary(): Promise<SponsorPackSummary> {
  return safe(
    async () => {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase
        .from("sponsor_packs")
        .select(
          "id, pack_status, scheduled_delivery, delivered_at, contents, members(first_name, last_name, member_type)",
        )
        .order("scheduled_delivery", { ascending: true, nullsFirst: false })
        .limit(20);

      const rows = (data ?? []) as unknown as PackShape[];

      let delivered = 0;
      let built = 0;
      let overdue = 0;
      const recent: SponsorPackRow[] = [];
      for (const row of rows) {
        const sponsor = row.members
          ? `${row.members.first_name} ${row.members.last_name}`
          : "(sponsor)";
        const tier = row.members ? TIER_LABELS[row.members.member_type] : "?";
        const itemsBlurb = (row.contents ?? [])
          .map((c) => `${c.qty}× ${c.item}`)
          .join(", ");
        recent.push({
          id: row.id,
          sponsorName: sponsor,
          tier,
          status: row.pack_status,
          detail: itemsBlurb || (row.pack_status === "delivered" ? "delivered" : "pack contents tbc"),
        });
        if (row.pack_status === "delivered") delivered += 1;
        if (row.pack_status === "built" || row.pack_status === "scheduled") built += 1;
        if (row.pack_status === "overdue") overdue += 1;
      }
      return { delivered, built, overdue, recent: recent.slice(0, 5) };
    },
    { delivered: 0, built: 0, overdue: 0, recent: [] },
  );
}

// ---------------------------------------------------------------------------
// Match day roster.
// ---------------------------------------------------------------------------
export type RosterShiftView = {
  id: string;
  role: string;
  slotLabel: string;
  status: "filled" | "partial" | "empty";
  assignments: string[];
  required: number;
};
export type MatchDayRoster = {
  fixture: { matchDate: string; opponent: string | null; round: number | null } | null;
  shifts: RosterShiftView[];
};

const ROLE_LABELS: Record<string, string> = {
  gate: "Gate",
  bar: "Bar · RSA req'd",
  canteen: "Canteen",
  goal_umpire: "Goal umpires",
  timekeeper: "Timekeepers",
  first_aid: "First aid",
  runner: "Runner",
  boundary_umpire: "Boundary umpires",
};

type FixtureRowShape = {
  id: string;
  match_date: string;
  opponent: string | null;
  round_number: number | null;
};
type ShiftRowShape = {
  id: string;
  role: string;
  start_time: string | null;
  end_time: string | null;
  slots_required: number;
  roster_assignments: Array<{
    status: string;
    members: { first_name: string; last_name: string } | null;
  }> | null;
};

export async function getNextMatchDayRoster(): Promise<MatchDayRoster> {
  return safe(
    async () => {
      const supabase = await createSupabaseServerClient();
      const today = new Date().toISOString().slice(0, 10);
      const { data: fixtureData } = await supabase
        .from("fixtures")
        .select("id, match_date, opponent, round_number")
        .gte("match_date", today)
        .order("match_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      const fixture = fixtureData as unknown as FixtureRowShape | null;
      if (!fixture) return { fixture: null, shifts: [] };

      const { data: shiftsData } = await supabase
        .from("roster_shifts")
        .select(
          "id, role, start_time, end_time, slots_required, roster_assignments(status, members(first_name, last_name))",
        )
        .eq("fixture_id", fixture.id);

      const shifts = (shiftsData ?? []) as unknown as ShiftRowShape[];

      const shiftRows: RosterShiftView[] = shifts.map((s) => {
        const assigned = (s.roster_assignments ?? [])
          .filter((a) => a.status === "confirmed" && a.members)
          .map((a) => `${a.members!.first_name[0]}. ${a.members!.last_name}`);
        const status: RosterShiftView["status"] =
          assigned.length >= s.slots_required
            ? "filled"
            : assigned.length === 0
              ? "empty"
              : "partial";
        const slotLabel = [s.start_time, s.end_time].filter(Boolean).join("–") || "all day";
        return {
          id: s.id,
          role: ROLE_LABELS[s.role] ?? s.role,
          slotLabel,
          status,
          assignments: assigned,
          required: s.slots_required,
        };
      });

      return {
        fixture: {
          matchDate: fixture.match_date,
          opponent: fixture.opponent,
          round: fixture.round_number,
        },
        shifts: shiftRows,
      };
    },
    { fixture: null, shifts: [] },
  );
}
