/**
 * Wallaroo FC Secretary Portal — Database type definitions.
 *
 * Hand-written shape that matches the SQL migrations under
 * `supabase/migrations/`. Kept here (not generated) so the schema and the
 * TypeScript stay in lockstep without a Supabase project round-trip.
 *
 * Convention: each table has Row (server response), Insert (write shape
 * with optional defaults), and Update (partial write).
 */

export type Role = "secretary" | "president" | "treasurer" | "coach" | "committee" | "viewer";

export type MemberType =
  | "life"
  | "senior"
  | "junior"
  | "gold_sponsor"
  | "silver_sponsor"
  | "bronze_sponsor"
  | "vip"
  | "honorary"
  | "other";

export type Squad = "seniors" | "reserves" | "snr_colts" | "jnr_colts" | "u11s" | "u9s";
export type YearInGrade = "first" | "middle" | "last" | "last_exempt";
export type JumperStatus = "pending" | "suggested" | "confirmed" | "retired";
export type JumperQueueStatus = "pending" | "allocated" | "dismissed";
export type CertType =
  | "wwcc"
  | "first_aid"
  | "rsa"
  | "trainer_level_0"
  | "trainer_level_1"
  | "trainer_level_2"
  | "coach_accred"
  | "other";
export type RosterRole =
  | "gate"
  | "bar"
  | "canteen"
  | "goal_umpire"
  | "timekeeper"
  | "first_aid"
  | "runner"
  | "boundary_umpire";
export type RosterStatus = "invited" | "confirmed" | "declined" | "no_response";
export type SponsorPackStatus = "to_build" | "built" | "scheduled" | "delivered" | "overdue";
export type MilestoneType =
  | "50_games"
  | "100_games"
  | "150_games"
  | "200_games"
  | "250_games"
  | "300_games"
  | "life_member"
  | "other";
export type MilestoneStatus = "upcoming" | "imminent" | "completed" | "passed";
export type MeetingType = "committee" | "sub_committee" | "agm" | "sgm";
export type ActionItemStatus = "open" | "in_progress" | "done" | "cancelled";
export type HomeAway = "home" | "away";

type Timestamps = { created_at: string; updated_at: string };
type Optional<T> = T | null;

export type ProfileRow = {
  user_id: string;
  full_name: string;
  role: Role;
  phone: Optional<string>;
  signature_block: Optional<string>;
} & Timestamps;

export type MemberRow = {
  id: string;
  member_number: Optional<string>;
  member_type: MemberType;
  first_name: string;
  last_name: string;
  email: Optional<string>;
  phone: Optional<string>;
  postal_address: Optional<string>;
  prefers_post: boolean;
  prefers_email: boolean;
  joined_year: Optional<number>;
  paid_current_season: boolean;
  notes: Optional<string>;
  playhq_participant_id: Optional<string>;
} & Timestamps;

export type PlayerRow = {
  id: string;
  member_id: Optional<string>;
  squad: Squad;
  dob: Optional<string>;
  year_in_grade: Optional<YearInGrade>;
  guardian_name: Optional<string>;
  guardian_phone: Optional<string>;
  guardian_email: Optional<string>;
  health_flags: Optional<string>;
  position_preference: Optional<string>;
  jumper_number: Optional<number>;
  jumper_status: JumperStatus;
  last_season_jumper: Optional<number>;
  playhq_registered_at: Optional<string>;
  registered_current_season: boolean;
  games_played: number;
  games_played_seniors: number;
} & Timestamps;

export type JumperQueueRow = {
  id: string;
  player_id: Optional<string>;
  received_at: string;
  source: string;
  raw_email_id: Optional<string>;
  suggested_number: Optional<number>;
  suggested_reason: Optional<string>;
  status: JumperQueueStatus;
  resolved_at: Optional<string>;
  resolved_by: Optional<string>;
} & Timestamps;

export type ComplianceRow = {
  id: string;
  member_id: Optional<string>;
  cert_type: CertType;
  cert_number: Optional<string>;
  issued_date: Optional<string>;
  expiry_date: Optional<string>;
  evidence_file_path: Optional<string>;
  notes: Optional<string>;
  last_reminder_sent_at: Optional<string>;
} & Timestamps;

export type FixtureRow = {
  id: string;
  round_number: Optional<number>;
  match_date: string;
  home_away: Optional<HomeAway>;
  opponent: Optional<string>;
  venue: Optional<string>;
  grade: Optional<Squad>;
  notes: Optional<string>;
} & Timestamps;

export type RosterShiftRow = {
  id: string;
  fixture_id: string;
  role: RosterRole;
  start_time: Optional<string>;
  end_time: Optional<string>;
  slots_required: number;
  requires_rsa: boolean;
  requires_first_aid: boolean;
  notes: Optional<string>;
} & Timestamps;

export type RosterAssignmentRow = {
  id: string;
  shift_id: string;
  member_id: Optional<string>;
  status: RosterStatus;
  invited_at: Optional<string>;
  responded_at: Optional<string>;
  reminder_count: number;
} & Timestamps;

export type SponsorPackContents = Array<{ item: string; qty: number }>;

export type SponsorPackRow = {
  id: string;
  member_id: Optional<string>;
  season: number;
  pack_status: SponsorPackStatus;
  contents: SponsorPackContents;
  scheduled_delivery: Optional<string>;
  delivered_at: Optional<string>;
  delivered_by: Optional<string>;
  signed_receipt_path: Optional<string>;
  notes: Optional<string>;
} & Timestamps;

export type MilestoneRow = {
  id: string;
  player_id: Optional<string>;
  milestone_type: Optional<MilestoneType>;
  target_game_count: Optional<number>;
  projected_fixture_id: Optional<string>;
  status: MilestoneStatus;
  jumper_ordered: boolean;
  presentation_planned: boolean;
  media_release_sent: boolean;
  notes: Optional<string>;
} & Timestamps;

export type BulldogsDollarsRow = {
  id: string;
  member_id: Optional<string>;
  voucher_code: string;
  amount_aud: string;
  issued_reason: Optional<string>;
  issued_at: string;
  redeemed_at: Optional<string>;
  redeemed_at_point: Optional<"bar" | "canteen">;
  redeemed_amount: Optional<string>;
} & Timestamps;

export type GateTakingsRow = {
  id: string;
  fixture_id: Optional<string>;
  cash_amount: string;
  eftpos_amount: string;
  adults_count: number;
  concessions_count: number;
  kids_count: number;
  notes: Optional<string>;
  recorded_at: string;
  recorded_by: Optional<string>;
} & Timestamps;

export type AgendaRow = {
  id: string;
  meeting_date: string;
  meeting_type: MeetingType;
  agenda_markdown: Optional<string>;
  minutes_markdown: Optional<string>;
  attendees: { present: string[]; apologies: string[] };
  published: boolean;
} & Timestamps;

export type ActionItemRow = {
  id: string;
  agenda_id: Optional<string>;
  description: string;
  assigned_to: Optional<string>;
  due_date: Optional<string>;
  status: ActionItemStatus;
} & Timestamps;

export type ActivityLogRow = {
  id: string;
  actor: Optional<string>;
  entity_table: string;
  entity_id: Optional<string>;
  action: string;
  diff: Record<string, unknown> | null;
  at: string;
};

/**
 * For Insert/Update we expose every column as optional. Marking truly
 * required columns (e.g. members.first_name) as required would also force
 * us to enumerate every column that has a SQL DEFAULT and reflect that
 * here — fragile by hand. Postgres still enforces NOT NULL constraints,
 * so a bad insert fails at runtime rather than compile time.
 */
type TableShape<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  // supabase-js v2.105 requires this; we don't embed nested-select hints
  // so an empty tuple is enough for type-checking.
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableShape<ProfileRow>;
      members: TableShape<MemberRow>;
      players: TableShape<PlayerRow>;
      jumper_allocation_queue: TableShape<JumperQueueRow>;
      compliance_records: TableShape<ComplianceRow>;
      fixtures: TableShape<FixtureRow>;
      roster_shifts: TableShape<RosterShiftRow>;
      roster_assignments: TableShape<RosterAssignmentRow>;
      sponsor_packs: TableShape<SponsorPackRow>;
      milestones: TableShape<MilestoneRow>;
      bulldogs_dollars: TableShape<BulldogsDollarsRow>;
      gate_takings: TableShape<GateTakingsRow>;
      agendas: TableShape<AgendaRow>;
      action_items: TableShape<ActionItemRow>;
      activity_log: TableShape<ActivityLogRow>;
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: { Args: Record<string, never>; Returns: Role | null };
      is_committee_member: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
  };
};
