-- Wallaroo FC Secretary Portal — initial schema
--
-- Every table carries id / created_at / updated_at (profiles is the lone
-- exception — user_id is the primary key). RLS is enabled in the next
-- migration to keep this file focused on shape.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null
    check (role in ('secretary','president','treasurer','coach','committee','viewer')),
  phone text,
  signature_block text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- members
-- ---------------------------------------------------------------------------
create table public.members (
  id uuid primary key default gen_random_uuid(),
  member_number text unique,
  member_type text not null
    check (member_type in (
      'life','senior','junior',
      'gold_sponsor','silver_sponsor','bronze_sponsor',
      'vip','honorary','other'
    )),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  postal_address text,
  prefers_post boolean not null default false,
  prefers_email boolean not null default true,
  joined_year int,
  paid_current_season boolean not null default false,
  notes text,
  playhq_participant_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index members_last_first_idx on public.members (last_name, first_name);
create index members_type_idx on public.members (member_type);
create index members_paid_idx on public.members (paid_current_season);

create trigger members_touch_updated_at
  before update on public.members
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- players
-- ---------------------------------------------------------------------------
create table public.players (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete cascade,
  squad text not null
    check (squad in ('seniors','reserves','snr_colts','jnr_colts','u11s','u9s')),
  dob date,
  year_in_grade text
    check (year_in_grade in ('first','middle','last','last_exempt')),
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  health_flags text,
  position_preference text,
  jumper_number int,
  jumper_status text not null default 'pending'
    check (jumper_status in ('pending','suggested','confirmed','retired')),
  last_season_jumper int,
  playhq_registered_at timestamptz,
  registered_current_season boolean not null default false,
  games_played int not null default 0,
  games_played_seniors int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index players_squad_jumper_uniq
  on public.players (squad, jumper_number)
  where jumper_number is not null;

create index players_squad_idx on public.players (squad);
create index players_member_idx on public.players (member_id);

create trigger players_touch_updated_at
  before update on public.players
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- jumper_allocation_queue
-- ---------------------------------------------------------------------------
create table public.jumper_allocation_queue (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  received_at timestamptz not null default now(),
  source text not null default 'playhq_email',
  raw_email_id text,
  suggested_number int,
  suggested_reason text,
  status text not null default 'pending'
    check (status in ('pending','allocated','dismissed')),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jumper_queue_status_idx on public.jumper_allocation_queue (status);

create trigger jumper_allocation_queue_touch_updated_at
  before update on public.jumper_allocation_queue
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- compliance_records
-- ---------------------------------------------------------------------------
create table public.compliance_records (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete cascade,
  cert_type text not null
    check (cert_type in (
      'wwcc','first_aid','rsa',
      'trainer_level_0','trainer_level_1','trainer_level_2',
      'coach_accred','other'
    )),
  cert_number text,
  issued_date date,
  expiry_date date,
  evidence_file_path text,
  notes text,
  last_reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index compliance_expiry_idx on public.compliance_records (expiry_date);
create index compliance_member_idx on public.compliance_records (member_id);

create trigger compliance_records_touch_updated_at
  before update on public.compliance_records
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- fixtures + rosters
-- ---------------------------------------------------------------------------
create table public.fixtures (
  id uuid primary key default gen_random_uuid(),
  round_number int,
  match_date date not null,
  home_away text check (home_away in ('home','away')),
  opponent text,
  venue text,
  grade text
    check (grade in ('seniors','reserves','snr_colts','jnr_colts','u11s','u9s')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fixtures_match_date_idx on public.fixtures (match_date);

create trigger fixtures_touch_updated_at
  before update on public.fixtures
  for each row execute function public.touch_updated_at();

create table public.roster_shifts (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references public.fixtures(id) on delete cascade,
  role text not null
    check (role in (
      'gate','bar','canteen','goal_umpire','timekeeper',
      'first_aid','runner','boundary_umpire'
    )),
  start_time time,
  end_time time,
  slots_required int not null default 1,
  requires_rsa boolean not null default false,
  requires_first_aid boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index roster_shifts_fixture_idx on public.roster_shifts (fixture_id);

create trigger roster_shifts_touch_updated_at
  before update on public.roster_shifts
  for each row execute function public.touch_updated_at();

create table public.roster_assignments (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.roster_shifts(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  status text not null default 'invited'
    check (status in ('invited','confirmed','declined','no_response')),
  invited_at timestamptz,
  responded_at timestamptz,
  reminder_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index roster_assignments_shift_idx on public.roster_assignments (shift_id);
create index roster_assignments_member_idx on public.roster_assignments (member_id);

create trigger roster_assignments_touch_updated_at
  before update on public.roster_assignments
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- sponsor_packs
-- ---------------------------------------------------------------------------
create table public.sponsor_packs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete cascade,
  season int not null,
  pack_status text not null default 'to_build'
    check (pack_status in ('to_build','built','scheduled','delivered','overdue')),
  contents jsonb not null default '[]'::jsonb,
  scheduled_delivery date,
  delivered_at date,
  delivered_by uuid references auth.users(id),
  signed_receipt_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index sponsor_packs_member_season_uniq
  on public.sponsor_packs (member_id, season);
create index sponsor_packs_status_idx on public.sponsor_packs (pack_status);

create trigger sponsor_packs_touch_updated_at
  before update on public.sponsor_packs
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- milestones
-- ---------------------------------------------------------------------------
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  milestone_type text
    check (milestone_type in (
      '50_games','100_games','150_games','200_games','250_games','300_games',
      'life_member','other'
    )),
  target_game_count int,
  projected_fixture_id uuid references public.fixtures(id),
  status text not null default 'upcoming'
    check (status in ('upcoming','imminent','completed','passed')),
  jumper_ordered boolean not null default false,
  presentation_planned boolean not null default false,
  media_release_sent boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index milestones_status_idx on public.milestones (status);

create trigger milestones_touch_updated_at
  before update on public.milestones
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- bulldogs_dollars
-- ---------------------------------------------------------------------------
create table public.bulldogs_dollars (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id),
  voucher_code text unique not null,
  amount_aud numeric(8,2) not null,
  issued_reason text,
  issued_at timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_at_point text check (redeemed_at_point in ('bar','canteen')),
  redeemed_amount numeric(8,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bulldogs_member_idx on public.bulldogs_dollars (member_id);
create index bulldogs_redeemed_idx on public.bulldogs_dollars (redeemed_at);

create trigger bulldogs_dollars_touch_updated_at
  before update on public.bulldogs_dollars
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- gate_takings
-- ---------------------------------------------------------------------------
create table public.gate_takings (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid references public.fixtures(id),
  cash_amount numeric(8,2) not null default 0,
  eftpos_amount numeric(8,2) not null default 0,
  adults_count int not null default 0,
  concessions_count int not null default 0,
  kids_count int not null default 0,
  notes text,
  recorded_at timestamptz not null default now(),
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gate_takings_fixture_idx on public.gate_takings (fixture_id);

create trigger gate_takings_touch_updated_at
  before update on public.gate_takings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- agendas + action_items
-- ---------------------------------------------------------------------------
create table public.agendas (
  id uuid primary key default gen_random_uuid(),
  meeting_date date not null,
  meeting_type text not null default 'committee'
    check (meeting_type in ('committee','sub_committee','agm','sgm')),
  agenda_markdown text,
  minutes_markdown text,
  attendees jsonb not null default '{"present":[],"apologies":[]}'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index agendas_meeting_date_idx on public.agendas (meeting_date);

create trigger agendas_touch_updated_at
  before update on public.agendas
  for each row execute function public.touch_updated_at();

create table public.action_items (
  id uuid primary key default gen_random_uuid(),
  agenda_id uuid references public.agendas(id) on delete cascade,
  description text not null,
  assigned_to uuid references auth.users(id),
  due_date date,
  status text not null default 'open'
    check (status in ('open','in_progress','done','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index action_items_status_idx on public.action_items (status);
create index action_items_agenda_idx on public.action_items (agenda_id);

create trigger action_items_touch_updated_at
  before update on public.action_items
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- activity_log
-- ---------------------------------------------------------------------------
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users(id),
  entity_table text not null,
  entity_id uuid,
  action text not null,
  diff jsonb,
  at timestamptz not null default now()
);

create index activity_log_at_idx on public.activity_log (at desc);
create index activity_log_entity_idx on public.activity_log (entity_table, entity_id);
