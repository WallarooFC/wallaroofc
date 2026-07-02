-- ============================================================
-- Migration 002: Player guernsey & training shirt numbers
-- ============================================================

-- Add guernsey ID column to players
-- Records the physical tag/label on the garment (text, e.g. "U9-05-A")
-- Used in U9s/U11s where multiple players share the same guernsey number
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS guernsey_id INTEGER;

-- Write policy: admin & committee can manage player records
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
