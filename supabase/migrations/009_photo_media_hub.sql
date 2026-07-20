-- 009_photo_media_hub.sql
-- Contributor photo pipeline: parent-photographers submit match photos via
-- SMS-authenticated portal → moderation queue on /admin/gallery → published
-- to public gallery on approval.

create table if not exists public.photo_contributors (
  id                   uuid primary key default gen_random_uuid(),
  mobile               text unique not null,     -- E.164 normalised
  full_name            text,
  email                text,
  is_active            boolean not null default true,
  consent_declared_at  timestamptz,
  last_login_at        timestamptz,
  created_at           timestamptz not null default now()
);
create index if not exists photo_contributors_mobile_idx on public.photo_contributors (mobile);

-- One-time login codes.  Codes are stored as sha256 hashes; plaintext to phone.
create table if not exists public.photo_login_codes (
  id             uuid primary key default gen_random_uuid(),
  mobile         text not null,
  code_hash      text not null,
  expires_at     timestamptz not null,
  used_at        timestamptz,
  attempts       int not null default 0,
  requested_ip   text,
  created_at     timestamptz not null default now()
);
create index if not exists photo_login_codes_mobile_idx on public.photo_login_codes (mobile);

-- Sessions issued after code verification.
create table if not exists public.photo_contributor_sessions (
  id             uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references public.photo_contributors(id) on delete cascade,
  token_hash     text not null,
  expires_at     timestamptz not null,
  revoked_at     timestamptz,
  ip             text,
  user_agent     text,
  created_at     timestamptz not null default now()
);
create index if not exists photo_contributor_sessions_token_idx on public.photo_contributor_sessions (token_hash);

-- Batches — one round of uploads at a time.
create table if not exists public.photo_submission_batches (
  id             uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references public.photo_contributors(id) on delete cascade,
  fixture_id     uuid references public.fixtures(id) on delete set null,
  round          int,
  season         int,
  grade          text,
  opponent       text,
  venue          text,
  match_date     date,
  note           text,
  consent_ack    boolean not null default false,
  photo_count    int not null default 0,
  submitted_at   timestamptz not null default now()
);

-- Individual photo submissions.
create table if not exists public.photo_submissions (
  id             uuid primary key default gen_random_uuid(),
  batch_id       uuid not null references public.photo_submission_batches(id) on delete cascade,
  contributor_id uuid not null references public.photo_contributors(id) on delete cascade,
  storage_path   text not null,
  thumb_path     text,
  original_name  text,
  content_type   text,
  width          int,
  height         int,
  size_bytes     bigint,
  caption        text,
  status         text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  gallery_id     uuid references public.gallery(id) on delete set null,
  reviewed_by    uuid references auth.users(id),
  reviewed_at    timestamptz,
  reject_reason  text,
  created_at     timestamptz not null default now()
);
create index if not exists photo_submissions_batch_idx  on public.photo_submissions (batch_id);
create index if not exists photo_submissions_status_idx on public.photo_submissions (status);

-- Restricted players register.
create table if not exists public.photo_restricted_players (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null,
  reason          text,
  added_by        uuid references auth.users(id),
  added_at        timestamptz not null default now()
);
create index if not exists photo_restricted_players_name_idx on public.photo_restricted_players (lower(full_name));

alter table public.photo_contributors         enable row level security;
alter table public.photo_login_codes          enable row level security;
alter table public.photo_contributor_sessions enable row level security;
alter table public.photo_submission_batches   enable row level security;
alter table public.photo_submissions          enable row level security;
alter table public.photo_restricted_players   enable row level security;

create policy photo_contributors_admin         on public.photo_contributors         for all using (public.has_portal_role()) with check (public.has_portal_role());
create policy photo_login_codes_admin          on public.photo_login_codes          for all using (public.has_portal_role()) with check (public.has_portal_role());
create policy photo_contributor_sessions_admin on public.photo_contributor_sessions for all using (public.has_portal_role()) with check (public.has_portal_role());
create policy photo_submission_batches_admin   on public.photo_submission_batches   for all using (public.has_portal_role()) with check (public.has_portal_role());
create policy photo_submissions_admin          on public.photo_submissions          for all using (public.has_portal_role()) with check (public.has_portal_role());
create policy photo_restricted_players_admin   on public.photo_restricted_players   for all using (public.has_portal_role()) with check (public.has_portal_role());
