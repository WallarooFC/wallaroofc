-- Wallaroo FC Secretary Portal — Row Level Security
--
-- v1 policy shape, deliberately uniform: committee roles (secretary,
-- president, treasurer, coach, committee) can do anything; viewer can
-- SELECT. Adding a role later = update is_committee_member() / add a
-- specific policy; no schema change.
--
-- The service role bypasses RLS (Supabase contract), so the seed script
-- and Vercel cron jobs that use SUPABASE_SERVICE_ROLE_KEY still work.

-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- A user can always read their own profile, so the client can determine
-- role without first being granted committee status.
create policy profiles_self_select on public.profiles
  for select to authenticated
  using (user_id = auth.uid());

create policy profiles_committee_all on public.profiles
  for all to authenticated
  using (public.is_committee_member())
  with check (public.is_committee_member());

create policy profiles_viewer_select on public.profiles
  for select to authenticated
  using (public.current_user_role() = 'viewer');

-- ---------------------------------------------------------------------------
-- A tiny helper to apply the standard "committee everything + viewer select"
-- shape to every other table without repeating six SQL statements per table.
-- ---------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array[
    'members',
    'players',
    'jumper_allocation_queue',
    'compliance_records',
    'fixtures',
    'roster_shifts',
    'roster_assignments',
    'sponsor_packs',
    'milestones',
    'bulldogs_dollars',
    'gate_takings',
    'agendas',
    'action_items',
    'activity_log'
  ];
begin
  foreach tbl in array tables loop
    execute format('alter table public.%I enable row level security;', tbl);

    execute format($p$
      create policy %I on public.%I
        for all to authenticated
        using (public.is_committee_member())
        with check (public.is_committee_member());
    $p$, tbl || '_committee_all', tbl);

    execute format($p$
      create policy %I on public.%I
        for select to authenticated
        using (public.current_user_role() = 'viewer');
    $p$, tbl || '_viewer_select', tbl);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- activity_log: nobody is permitted to mutate rows after the fact, even
-- committee members. Inserts come from the service role inside server
-- actions, which bypasses RLS.
-- ---------------------------------------------------------------------------
drop policy activity_log_committee_all on public.activity_log;

create policy activity_log_committee_select on public.activity_log
  for select to authenticated
  using (public.is_committee_member());
