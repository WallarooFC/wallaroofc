-- =============================================================================
-- Seed: Junior Fundraiser Pizza Night template + scheduled landing takeover
-- =============================================================================
-- Sourced from the "Wood Oven Pizza Night" flyer for the junior grades'
-- fundraiser held Thu 16 Jul 2026 at Wallaroo Oval clubrooms.
-- Runs on top of migration 005_templates_and_takeovers.sql.
--
-- Three rows are inserted, wrapped in a single transaction so a failure
-- rolls back the whole set:
--
--   1. social_facebook  — full flyer copy for a Facebook post. The
--                         site-native /admin manager only lists
--                         landing_takeover templates so this row won't
--                         appear in the UI; it's stored here as a
--                         canonical copy of the promo content.
--   2. landing_takeover — heading + body + "See the menu" CTA +
--                         imageUrl. Shows in /admin/takeovers and can
--                         be scheduled from there.
--   3. landing_takeovers row scheduling the takeover from
--         Sun 12 Jul 2026 · 19:30 ACST  →  Thu 16 Jul 2026 · 20:30 ACST
--      (ACST = UTC+9:30 in July, so UTC 2026-07-12T10:00Z → 2026-07-16T11:00Z).
--
-- Flyer PNG expected at public/public/takeover/pizza-night.png (matches
-- the Thursday Night convention). Upload pending.
-- =============================================================================

begin;

-- --- Facebook post ---------------------------------------------------------
insert into public.templates (title, category, body)
values (
  'Junior Fundraiser · Wood Oven Pizza Night — Facebook',
  'social_facebook',
  jsonb_build_object(
    'kind', 'social',
    'text',
    E'🍕 JUNIOR FUNDRAISER · WOOD OVEN PIZZA NIGHT\n' ||
    E'Thu 16 Jul · Wallaroo Oval clubrooms · orders from 5:30pm.\n\n' ||
    E'A club fundraiser for the junior grades — all welcome.\n\n' ||
    E'9-inch wood-fired pizzas, $15 each:\n' ||
    E'• Margherita — tomato, fresh tomato, cheese, herbs\n' ||
    E'• Pepperoni — mild pepperoni, cheese, tomato\n' ||
    E'• The Special — ham, pepperoni, kalamata olives, capsicum & cheese\n' ||
    E'• Ham & Cheese — classic; add pineapple on request\n\n' ||
    E'Sides: Garlic Bread $5/loaf.\n' ||
    E'From the kitchen: Nuggets & Chips $10 · Bowl of Chips $5 · Chicken or Beef Schnitzel w/ gravy $22 · Half Schnitzel $12.\n\n' ||
    E'Come along, back the juniors, feed the family. See you there.\n\n' ||
    E'Tradition lives here.',
    'hashtags', jsonb_build_array(
      '#WallarooFC',
      '#JuniorFundraiser',
      '#PizzaNight',
      '#WoodFired',
      '#CopperCoast',
      '#TraditionLivesHere'
    )
  )
);

-- --- Landing takeover ------------------------------------------------------
with lt as (
  insert into public.templates (title, category, body)
  values (
    'Junior Fundraiser · Wood Oven Pizza Night — Landing takeover',
    'landing_takeover',
    jsonb_build_object(
      'kind', 'takeover',
      'heading', 'Pizza Night · Thu 16 Jul',
      'body',
      'Junior fundraiser at the clubrooms. 9-inch wood-fired pizzas, $15 each — Margherita, Pepperoni, The Special, Ham & Cheese. Sides + schnitzels also on. Orders from 5:30pm.',
      'ctaLabel', 'See the menu',
      'ctaUrl', 'https://wallaroofc.com/pizza-night',
      'imageUrl', 'https://wallaroofc.com/takeover/pizza-night.png',
      'scale', 2,
      'rotate', true,
      'rotateDeg', 20
    )
  )
  returning id
)
-- --- Schedule the takeover -------------------------------------------------
insert into public.landing_takeovers (template_id, starts_at, ends_at)
select
  lt.id,
  timestamptz '2026-07-12 19:30:00+09:30',   -- Sun 12 Jul 7:30pm Adelaide (ACST)
  timestamptz '2026-07-16 20:30:00+09:30'    -- Thu 16 Jul 8:30pm Adelaide (ACST)
from lt;

commit;
