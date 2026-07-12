-- 007_sponsor_crm.sql
-- Sponsor relationship-management tables (contacts, notes, activity log).
--
-- Each sponsor is anchored on a `club_members` row (the "primary" row for that
-- sponsor — typically the lowest membership number in a multi-number group,
-- picked at the app layer). All entries cascade with the anchor row so deleting
-- a member cleans up their CRM history.

-- ── Sponsor contacts ─────────────────────────────────────────────────────────
create table if not exists public.sponsor_contacts (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references public.club_members(id) on delete cascade,
  full_name    text not null,
  role         text,
  email        text,
  phone        text,
  is_primary   boolean not null default false,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists sponsor_contacts_member_idx on public.sponsor_contacts (member_id);

-- ── Sponsor activity log ─────────────────────────────────────────────────────
-- Timestamped log entries: calls, emails, meetings, renewals, notes.
create table if not exists public.sponsor_activities (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid not null references public.club_members(id) on delete cascade,
  activity_type   text not null check (activity_type in (
                    'call', 'email', 'meeting', 'letter',
                    'payment', 'renewal', 'note', 'other'
                  )),
  activity_date   date not null default current_date,
  summary         text not null,
  details         text,
  contact_person  text,
  outcome         text,
  follow_up_date  date,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now()
);

create index if not exists sponsor_activities_member_idx  on public.sponsor_activities (member_id);
create index if not exists sponsor_activities_date_idx    on public.sponsor_activities (activity_date desc);
create index if not exists sponsor_activities_followup_idx on public.sponsor_activities (follow_up_date) where follow_up_date is not null;

-- ── updated_at trigger for contacts ──────────────────────────────────────────
create or replace function public.tg_sponsor_contacts_touch()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists sponsor_contacts_touch on public.sponsor_contacts;
create trigger sponsor_contacts_touch
before update on public.sponsor_contacts
for each row execute function public.tg_sponsor_contacts_touch();

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Reuse has_portal_role() from migration 005 (no-arg: admin/secretary/president/treasurer/committee).
alter table public.sponsor_contacts   enable row level security;
alter table public.sponsor_activities enable row level security;

create policy sponsor_contacts_select on public.sponsor_contacts
  for select using (public.has_portal_role());
create policy sponsor_contacts_insert on public.sponsor_contacts
  for insert with check (public.has_portal_role());
create policy sponsor_contacts_update on public.sponsor_contacts
  for update using (public.has_portal_role())
  with check (public.has_portal_role());
create policy sponsor_contacts_delete on public.sponsor_contacts
  for delete using (public.has_portal_role());

create policy sponsor_activities_select on public.sponsor_activities
  for select using (public.has_portal_role());
create policy sponsor_activities_insert on public.sponsor_activities
  for insert with check (public.has_portal_role());
create policy sponsor_activities_update on public.sponsor_activities
  for update using (public.has_portal_role())
  with check (public.has_portal_role());
create policy sponsor_activities_delete on public.sponsor_activities
  for delete using (public.has_portal_role());
