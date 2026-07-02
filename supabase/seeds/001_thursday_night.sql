-- =============================================================================
-- Seed: Thursday Night meals template (Facebook + landing takeover)
-- =============================================================================
-- Sourced from the portal/reference/thursday-night-flyer.png flyer.
-- Runs on top of migration 005_templates_and_takeovers.sql.
--
-- Two rows are inserted:
--   1. A social_facebook post — full menu breakdown, hashtags.
--   2. A landing_takeover      — tight version for the website overlay,
--                                fired for 10 s per landing visit while
--                                scheduled.
-- =============================================================================

-- --- Facebook post ---------------------------------------------------------
insert into public.templates (title, category, body)
values (
  'Thursday Night Meals — Facebook post',
  'social_facebook',
  jsonb_build_object(
    'kind', 'social',
    'text',
    E'🏉 THURSDAY NIGHT MEALS in the clubrooms — from 5:30pm, after training.\n\n' ||
    E'On the menu:\n' ||
    E'• Chicken or beef parmi — $24\n' ||
    E'• Chicken or beef schnitzel — $22\n' ||
    E'• Half schnitzel — $12\n' ||
    E'• Nuggets & chips — $10\n\n' ||
    E'Plus a veggie bar. Bar open — all welcome. See you at Wallaroo Oval.\n\n' ||
    E'Tradition lives here.',
    'hashtags', jsonb_build_array(
      '#WallarooFC',
      '#ThursdayNight',
      '#ClubroomsMeals',
      '#CopperCoast',
      '#TraditionLivesHere'
    )
  )
);

-- --- Landing takeover ------------------------------------------------------
insert into public.templates (title, category, body)
values (
  'Thursday Night Meals — Landing takeover',
  'landing_takeover',
  jsonb_build_object(
    'kind', 'takeover',
    'heading', 'Thursday Night · From 5:30pm',
    'body',
    'Meals in the clubrooms tonight after training. Parmi $24 · Schnitzel $22 · Half schnitzel $12 · Nuggets & chips $10. Veggie bar available. Bar open, all welcome.',
    'ctaLabel', 'See the menu',
    'ctaUrl', 'https://wallaroofc.com/thursday-night'
  )
);
