-- =============================================================================
-- Templates + Landing Takeovers
-- =============================================================================
-- Adds two related tables:
--   `templates`          — reusable content for social posts, admin letters,
--                          and landing takeovers. Fully editable at any time.
--   `landing_takeovers`  — schedules a `landing_takeover` template to show
--                          as a centred modal overlay on the public site
--                          during a specific time window.
--
-- RLS: authenticated users with role secretary/president/committee can read
-- and write. The public takeover API uses the service-role client to read.
-- =============================================================================

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in (
    'social_facebook',
    'social_instagram',
    'admin_letter',
    'landing_takeover'
  )),
  body jsonb not null default '{}'::jsonb,
  image_path text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists templates_category_idx on public.templates(category);
create index if not exists templates_updated_at_idx on public.templates(updated_at desc);

create table if not exists public.landing_takeovers (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_paused boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists landing_takeovers_window_idx
  on public.landing_takeovers(starts_at, ends_at)
  where is_paused = false;

-- Trigger to keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists templates_set_updated_at on public.templates;
create trigger templates_set_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

drop trigger if exists landing_takeovers_set_updated_at on public.landing_takeovers;
create trigger landing_takeovers_set_updated_at
  before update on public.landing_takeovers
  for each row execute function public.set_updated_at();

-- Overlap guard: prevents scheduling a takeover whose window overlaps an
-- existing non-paused takeover. Enforced at insert/update time.
create or replace function public.landing_takeovers_no_overlap()
returns trigger
language plpgsql
as $$
begin
  if new.is_paused then
    return new;
  end if;

  if exists (
    select 1
      from public.landing_takeovers other
     where other.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
       and other.is_paused = false
       and tstzrange(other.starts_at, other.ends_at, '[)') &&
           tstzrange(new.starts_at, new.ends_at, '[)')
  ) then
    raise exception 'Takeover window overlaps an existing active takeover'
      using errcode = '23P01';
  end if;

  return new;
end;
$$;

drop trigger if exists landing_takeovers_overlap_guard on public.landing_takeovers;
create trigger landing_takeovers_overlap_guard
  before insert or update on public.landing_takeovers
  for each row execute function public.landing_takeovers_no_overlap();

-- Row Level Security ---------------------------------------------------------
alter table public.templates enable row level security;
alter table public.landing_takeovers enable row level security;

-- Templates: any authenticated user with a "portal writer" role can do all
-- ops. `has_portal_role()` is defined below and centralises the role check
-- so future migrations only need to update the function.
create or replace function public.has_portal_role()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
      from public.profiles p
     where p.user_id = auth.uid()
       and p.role in ('secretary', 'president', 'treasurer', 'committee')
  );
$$;

drop policy if exists templates_select on public.templates;
create policy templates_select on public.templates
  for select using (public.has_portal_role());

drop policy if exists templates_insert on public.templates;
create policy templates_insert on public.templates
  for insert with check (public.has_portal_role() and created_by = auth.uid());

drop policy if exists templates_update on public.templates;
create policy templates_update on public.templates
  for update using (public.has_portal_role())
  with check (public.has_portal_role());

drop policy if exists templates_delete on public.templates;
create policy templates_delete on public.templates
  for delete using (public.has_portal_role());

drop policy if exists takeovers_select on public.landing_takeovers;
create policy takeovers_select on public.landing_takeovers
  for select using (public.has_portal_role());

drop policy if exists takeovers_insert on public.landing_takeovers;
create policy takeovers_insert on public.landing_takeovers
  for insert with check (public.has_portal_role() and created_by = auth.uid());

drop policy if exists takeovers_update on public.landing_takeovers;
create policy takeovers_update on public.landing_takeovers
  for update using (public.has_portal_role())
  with check (public.has_portal_role());

drop policy if exists takeovers_delete on public.landing_takeovers;
create policy takeovers_delete on public.landing_takeovers
  for delete using (public.has_portal_role());
