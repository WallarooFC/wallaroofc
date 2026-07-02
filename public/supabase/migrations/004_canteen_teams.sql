-- ============================================================
-- Migration 004 — Canteen team restrictions
-- ============================================================

-- 1. Add club column to players (football vs netball)
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS club text NOT NULL DEFAULT 'football'
  CHECK (club IN ('football', 'netball'));

-- 2. Add slot-level restrictions to canteen_slots
ALTER TABLE public.canteen_slots
  ADD COLUMN IF NOT EXISTS club text NOT NULL DEFAULT 'any'
  CHECK (club IN ('football', 'netball', 'any')),
  ADD COLUMN IF NOT EXISTS eligible_grades text[] NOT NULL DEFAULT '{}';

-- 3. Shift rules template table
--    One row per time_slot. Applied when new game days are seeded,
--    and when "Save & Apply" is used from the admin canteen page.
CREATE TABLE IF NOT EXISTS public.canteen_shift_rules (
  time_slot       text PRIMARY KEY,          -- '9.30-11.30' | '11.30-1.30' | '1.30-3.30'
  club            text NOT NULL DEFAULT 'any'
                  CHECK (club IN ('football', 'netball', 'any')),
  eligible_grades text[] NOT NULL DEFAULT '{}',
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.canteen_shift_rules ENABLE ROW LEVEL SECURITY;

-- Public read (needed for the public canteen page to show eligibility badges)
CREATE POLICY "public read shift rules"
  ON public.canteen_shift_rules FOR SELECT USING (true);

-- Committee+ can write
CREATE POLICY "committee write shift rules"
  ON public.canteen_shift_rules FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'committee')
    )
  );

-- Seed empty rules for all three time slots
INSERT INTO public.canteen_shift_rules (time_slot) VALUES
  ('9.30-11.30'),
  ('11.30-1.30'),
  ('1.30-3.30')
ON CONFLICT (time_slot) DO NOTHING;
