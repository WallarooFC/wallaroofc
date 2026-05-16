# Supabase

SQL migrations live in `migrations/` and are applied either via the
Supabase CLI (`supabase db push`) or the Supabase dashboard SQL editor.

## Apply

```bash
# CLI route (preferred once a project is linked):
supabase link --project-ref <ref>
supabase db push
```

Dashboard route: open the SQL editor and paste each file under
`migrations/` in order — they're prefixed `2026...` so chronological =
correct.

## Files

| File                                          | Purpose                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------- |
| `20260516000000_extensions_and_helpers.sql`   | `pgcrypto`, `pg_trgm`, `touch_updated_at()`, `current_user_role()`, `is_committee_member()` |
| `20260516000100_schema.sql`                   | All app tables: profiles, members, players, queue, compliance, fixtures, rosters, sponsors, milestones, finance, governance, audit |
| `20260516000200_rls.sql`                      | RLS enabled on every table; committee gets `ALL`, viewer gets `SELECT`           |

## Seed

After migrations land and Thomas's auth user exists
(`secretary@wallaroofc.com.au`), run the seed:

```bash
pnpm seed
```

The seed is idempotent — re-runs upsert by natural keys (member number,
member_id + cert_type, match_date + grade + opponent). Any source-data
quirks are surfaced as a flag summary at the end of the run rather than
silently coerced.
