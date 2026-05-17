-- Wallaroo FC Secretary Portal — extensions + shared helpers
--
-- All tables share an updated_at trigger and the RLS policies share a
-- single role-lookup helper, so they live here ahead of the schema files.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- updated_at touch trigger
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- current_user_role() — returns the role for the currently-authenticated
-- user, or NULL when unauthenticated / not yet provisioned.
--
-- SECURITY DEFINER so it can read public.profiles even when the calling
-- user has no SELECT policy on it. Search path pinned per Supabase advisor.
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where user_id = auth.uid();
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated, anon;

-- Convenience predicate used by every "committee can do everything" policy.
create or replace function public.is_committee_member()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.current_user_role() in
    ('secretary', 'president', 'treasurer', 'coach', 'committee');
$$;

revoke all on function public.is_committee_member() from public;
grant execute on function public.is_committee_member() to authenticated, anon;
