-- =============================================================================
-- Club membership register + meal-voucher entitlements
-- =============================================================================
-- Sourced from WFC_2026_Members__Players_copy.xlsx (WFC 2026 sheet +
-- Meal Vouchers sheet). Separate from the existing `members` table, which
-- is a PlayHQ player-sync surface (different keying, no membership numbers).
--
--   club_members          — one row per numbered membership. Sponsors that
--                           own multiple numbers get one row per number.
--   voucher_entitlements  — meal/drink voucher entitlements attached to a
--                           membership. Recorded against the primary
--                           membership_number in the workbook's
--                           multi-number grouping.
-- =============================================================================

create table if not exists public.club_members (
  id uuid primary key default gen_random_uuid(),
  membership_number integer not null unique check (membership_number > 0),
  full_name text,
  membership_type text,
  email text,
  phone text,
  postal_address text,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists club_members_membership_type_idx on public.club_members(membership_type);
create index if not exists club_members_full_name_idx on public.club_members(full_name);

drop trigger if exists club_members_set_updated_at on public.club_members;
create trigger club_members_set_updated_at
  before update on public.club_members
  for each row execute function public.set_updated_at();

create table if not exists public.voucher_entitlements (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.club_members(id) on delete cascade,
  count integer not null check (count > 0),
  description text default 'Meal and Drinks for 4',
  member_group text,   -- e.g. "61, 62, 295" — the full grouping the entitlement came from
  season integer not null default 2026,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists voucher_entitlements_member_idx on public.voucher_entitlements(member_id);
create index if not exists voucher_entitlements_season_idx on public.voucher_entitlements(season);

drop trigger if exists voucher_entitlements_set_updated_at on public.voucher_entitlements;
create trigger voucher_entitlements_set_updated_at
  before update on public.voucher_entitlements
  for each row execute function public.set_updated_at();

-- Row Level Security ---------------------------------------------------------
alter table public.club_members enable row level security;
alter table public.voucher_entitlements enable row level security;

-- Reuses has_portal_role() from migration 005.
drop policy if exists club_members_select on public.club_members;
create policy club_members_select on public.club_members
  for select using (public.has_portal_role());

drop policy if exists club_members_insert on public.club_members;
create policy club_members_insert on public.club_members
  for insert with check (public.has_portal_role());

drop policy if exists club_members_update on public.club_members;
create policy club_members_update on public.club_members
  for update using (public.has_portal_role())
  with check (public.has_portal_role());

drop policy if exists club_members_delete on public.club_members;
create policy club_members_delete on public.club_members
  for delete using (public.has_portal_role());

drop policy if exists voucher_entitlements_select on public.voucher_entitlements;
create policy voucher_entitlements_select on public.voucher_entitlements
  for select using (public.has_portal_role());

drop policy if exists voucher_entitlements_insert on public.voucher_entitlements;
create policy voucher_entitlements_insert on public.voucher_entitlements
  for insert with check (public.has_portal_role());

drop policy if exists voucher_entitlements_update on public.voucher_entitlements;
create policy voucher_entitlements_update on public.voucher_entitlements
  for update using (public.has_portal_role())
  with check (public.has_portal_role());

drop policy if exists voucher_entitlements_delete on public.voucher_entitlements;
create policy voucher_entitlements_delete on public.voucher_entitlements
  for delete using (public.has_portal_role());
