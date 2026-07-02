-- ============================================================
-- Wallaroo FC — Admin Permissions System
-- Migration 003
-- ============================================================

-- Add position title to profiles (e.g. "President", "Secretary")
alter table public.profiles
  add column if not exists title text;

-- ============================================================
-- ADMIN PERMISSIONS
-- Per-user, per-page view and edit access control.
-- Users with role = 'admin' bypass this table entirely (full access).
-- ============================================================

create table if not exists public.admin_permissions (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  page      text not null,
  can_view  boolean not null default false,
  can_edit  boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, page)
);

-- Trigger: keep updated_at current
create trigger admin_permissions_updated_at
  before update on public.admin_permissions
  for each row execute function public.set_updated_at();

-- RLS: only admins (service role) can read/write permissions
alter table public.admin_permissions enable row level security;

create policy "Service role full access"
  on public.admin_permissions
  using (true)
  with check (true);

-- Users can read their own permissions
create policy "Users can read own permissions"
  on public.admin_permissions
  for select
  using (auth.uid() = user_id);
