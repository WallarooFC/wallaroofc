-- ============================================================
-- Wallaroo FC — Initial Database Schema
-- Migration 001
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";   -- for fuzzy name search

-- ============================================================
-- AUTH PROFILES
-- One row per committee member / volunteer (linked to auth.users)
-- ============================================================
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text not null,
  email           text not null,
  phone           text,
  role            text not null default 'committee'
                  check (role in ('admin','committee','volunteer')),
  avatar_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Trigger: keep updated_at current
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- PLAYHQ SYNC — FIXTURES
-- ============================================================
create table public.fixtures (
  id              uuid primary key default uuid_generate_v4(),
  playhq_id       text unique,              -- PlayHQ internal ID
  season          integer not null,
  round           integer not null,
  grade           text not null,            -- 'A-Grade','B Grade','Senior Colts', etc.
  match_date      date,
  match_time      time,
  venue           text,
  home_team       text,
  away_team       text,
  is_home         boolean,                  -- true if Wallaroo is home team
  opponent        text,
  status          text default 'upcoming'
                  check (status in ('upcoming','now','completed','bye','postponed')),
  synced_at       timestamptz default now(),
  created_at      timestamptz not null default now()
);

create index fixtures_season_round on public.fixtures(season, round);
create index fixtures_grade on public.fixtures(grade);

-- ============================================================
-- PLAYHQ SYNC — RESULTS
-- ============================================================
create table public.results (
  id              uuid primary key default uuid_generate_v4(),
  playhq_id       text unique,
  fixture_id      uuid references public.fixtures(id) on delete set null,
  season          integer not null,
  round           integer not null,
  grade           text not null,
  home_team       text not null,
  home_score      integer,
  away_team       text not null,
  away_score      integer,
  margin          integer generated always as (abs(coalesce(home_score,0) - coalesce(away_score,0))) stored,
  bye_team        text,                     -- populated if it was a bye
  synced_at       timestamptz default now(),
  created_at      timestamptz not null default now()
);

create index results_season_round on public.results(season, round);

-- ============================================================
-- PLAYHQ SYNC — LADDERS
-- ============================================================
create table public.ladders (
  id              uuid primary key default uuid_generate_v4(),
  season          integer not null,
  grade           text not null,
  tab_label       text,
  display_order   integer default 0,
  columns         jsonb not null default '[]',   -- column definitions
  rows            jsonb not null default '[]',   -- ladder row data
  synced_at       timestamptz default now(),
  created_at      timestamptz not null default now(),
  unique(season, grade)
);

-- ============================================================
-- PLAYHQ SYNC — PLAYERS
-- ============================================================
create table public.players (
  id              uuid primary key default uuid_generate_v4(),
  playhq_id       text unique,
  first_name      text not null,
  last_name       text not null,
  full_name       text generated always as (first_name || ' ' || last_name) stored,
  dob             date,
  gender          text,
  email           text,
  phone           text,
  address         text,
  emergency_name  text,
  emergency_phone text,
  grade           text,                     -- current registered grade
  jumper_number   integer,
  season          integer,
  registration_status text default 'active',
  playhq_data     jsonb,                    -- raw PlayHQ payload for reference
  synced_at       timestamptz default now(),
  created_at      timestamptz not null default now()
);

create index players_full_name_trgm on public.players using gin(full_name gin_trgm_ops);
create index players_grade on public.players(grade);

-- ============================================================
-- VOLUNTEERS & QUALIFICATIONS
-- ============================================================
create table public.volunteers (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid references public.profiles(id) on delete set null,
  first_name      text not null,
  last_name       text not null,
  email           text,
  phone           text,
  roles           text[] default '{}',      -- ['bar','gate','canteen','trainer', ...]
  active          boolean default true,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger volunteers_updated_at
  before update on public.volunteers
  for each row execute function public.set_updated_at();

create table public.qualifications (
  id              uuid primary key default uuid_generate_v4(),
  volunteer_id    uuid not null references public.volunteers(id) on delete cascade,
  type            text not null
                  check (type in (
                    'wwc',              -- Working With Children check
                    'first_aid',
                    'rsa',              -- Responsible Service of Alcohol
                    'level1_coaching',
                    'level2_coaching',
                    'umpire',
                    'sports_trainer',
                    'other'
                  )),
  label           text,                     -- custom label for 'other'
  reference_number text,
  issued_date     date,
  expiry_date     date,
  document_url    text,                     -- Supabase Storage path
  verified        boolean default false,
  verified_by     uuid references public.profiles(id),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger qualifications_updated_at
  before update on public.qualifications
  for each row execute function public.set_updated_at();

create index qualifications_volunteer on public.qualifications(volunteer_id);
create index qualifications_expiry on public.qualifications(expiry_date);

-- ============================================================
-- BAR ROSTER
-- ============================================================
create table public.bar_shifts (
  id              uuid primary key default uuid_generate_v4(),
  shift_date      date not null,
  round           integer,
  label           text,                     -- e.g. "Round 6 Home Game"
  start_time      time not null default '11:00',
  end_time        time not null default '18:00',
  volunteers_needed integer default 4,
  notes           text,
  created_at      timestamptz not null default now()
);

create table public.bar_roster (
  id              uuid primary key default uuid_generate_v4(),
  shift_id        uuid not null references public.bar_shifts(id) on delete cascade,
  volunteer_id    uuid not null references public.volunteers(id) on delete cascade,
  confirmed       boolean default false,
  note            text,
  created_at      timestamptz not null default now(),
  unique(shift_id, volunteer_id)
);

-- ============================================================
-- SPONSORS
-- ============================================================
create table public.sponsors (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  tier            text not null default 'bronze'
                  check (tier in ('platinum','vip','gold','silver','bronze')),
  logo_url        text,                     -- Supabase Storage path or external URL
  website         text,
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  display_order   integer default 999,
  active          boolean default true,
  season          integer,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger sponsors_updated_at
  before update on public.sponsors
  for each row execute function public.set_updated_at();

-- ============================================================
-- NEWS
-- ============================================================
create table public.news (
  id              uuid primary key default uuid_generate_v4(),
  slug            text unique not null,
  title           text not null,
  category        text default 'Club News',
  body_md         text,                     -- Markdown content
  author_id       uuid references public.profiles(id),
  pinned          boolean default false,
  published       boolean default false,
  published_at    timestamptz,
  image_url       text,
  href            text,                     -- external link override
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger news_updated_at
  before update on public.news
  for each row execute function public.set_updated_at();

-- ============================================================
-- SOCIAL CALENDAR
-- ============================================================
create table public.social_events (
  id              uuid primary key default uuid_generate_v4(),
  round           integer,
  event_date      date,
  time_range      text,
  title           text not null,
  description     text,
  location        text,
  icon            text default 'calendar',
  created_at      timestamptz not null default now()
);

-- ============================================================
-- SITE CONFIG (replaces site.yml)
-- ============================================================
create table public.site_config (
  key             text primary key,
  value           text,
  updated_at      timestamptz not null default now()
);

insert into public.site_config (key, value) values
  ('current_round',         '6'),
  ('current_date',          'Sat 20 May'),
  ('season',                '2026'),
  ('next_match_opponent',    'ardrossan'),
  ('next_match_opponent_name','Ardrossan'),
  ('next_match_home_or_away','AWAY'),
  ('next_match_date',        'Sat 20 May'),
  ('next_match_venue',       'Ardrossan'),
  ('next_match_bounce',      '2:40 PM'),
  ('our_record',             '4W 1L'),
  ('next_match_opponent_record','3W 2L'),
  ('this_week_venue',        'Ardrossan Oval'),
  ('this_week_venue_label',  'Away');

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Public read: fixtures, results, ladders, sponsors, news, social_events, site_config
alter table public.fixtures      enable row level security;
alter table public.results       enable row level security;
alter table public.ladders       enable row level security;
alter table public.sponsors      enable row level security;
alter table public.news          enable row level security;
alter table public.social_events enable row level security;
alter table public.site_config   enable row level security;

-- Auth-only: profiles, players, volunteers, qualifications, bar_shifts, bar_roster
alter table public.profiles       enable row level security;
alter table public.players        enable row level security;
alter table public.volunteers     enable row level security;
alter table public.qualifications enable row level security;
alter table public.bar_shifts     enable row level security;
alter table public.bar_roster     enable row level security;

-- Public tables: anyone can read
create policy "public read fixtures"      on public.fixtures      for select using (true);
create policy "public read results"       on public.results       for select using (true);
create policy "public read ladders"       on public.ladders       for select using (true);
create policy "public read site_config"   on public.site_config   for select using (true);
create policy "public read social_events" on public.social_events for select using (true);
create policy "public read sponsors"      on public.sponsors      for select using (active = true);
create policy "public read news"          on public.news          for select using (published = true);

-- Auth tables: only authenticated users
create policy "auth read profiles"    on public.profiles       for select using (auth.uid() is not null);
create policy "auth read players"     on public.players        for select using (auth.uid() is not null);
create policy "auth read volunteers"  on public.volunteers     for select using (auth.uid() is not null);
create policy "auth read quals"       on public.qualifications for select using (auth.uid() is not null);
create policy "auth read bar_shifts"  on public.bar_shifts     for select using (auth.uid() is not null);
create policy "auth read bar_roster"  on public.bar_roster     for select using (auth.uid() is not null);

-- Write policies: only admin/committee roles can write
create policy "committee write fixtures"  on public.fixtures  for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','committee'))
);
create policy "committee write results"   on public.results   for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','committee'))
);
create policy "admin write all"           on public.volunteers for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "admin write qualifications" on public.qualifications for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','committee'))
);
create policy "admin write bar"           on public.bar_shifts for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','committee'))
);
create policy "auth write bar_roster"     on public.bar_roster for all using (
  auth.uid() is not null
);
create policy "admin write sponsors"      on public.sponsors for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "admin write news"          on public.news for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','committee'))
);
create policy "own profile"               on public.profiles for update using (auth.uid() = id);
