/**
 * Apply migration 002 — player_numbers
 * Uses the Supabase Management API (requires SUPABASE_ACCESS_TOKEN env var)
 * or falls back to instructions for the Supabase dashboard.
 *
 * Run: node scripts/apply-migration-002.cjs
 */

const sql = `
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS guernsey_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'players'
      AND policyname = 'committee write players'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "committee write players" ON public.players
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin','committee')
          )
        )
    $policy$;
  END IF;
END$$;
`;

const PROJECT_REF = 'linaudktxwrqelngffol';
const PAT = process.env.SUPABASE_ACCESS_TOKEN;

if (!PAT) {
  console.log('\n⚠️  No SUPABASE_ACCESS_TOKEN found.\n');
  console.log('Apply migration manually in the Supabase dashboard:');
  console.log('  https://supabase.com/dashboard/project/linaudktxwrqelngffol/sql/new\n');
  console.log('Paste and run this SQL:\n');
  console.log('─'.repeat(60));
  console.log(sql.trim());
  console.log('─'.repeat(60));
  process.exit(0);
}

(async () => {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (res.ok) {
    console.log('✅ Migration 002 applied successfully.');
  } else {
    const txt = await res.text();
    console.error('❌ Migration failed:', res.status, txt);
    process.exit(1);
  }
})();
