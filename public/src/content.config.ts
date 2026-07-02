/**
 * Content collections for the Wallaroo FC site.
 *
 * Each collection corresponds to a section of the Decap CMS admin
 * (public/admin/config.yml) so the committee can edit it via the web UI.
 *
 * File layout under src/content/:
 *   site.yml                      — site-wide weekly state (current round, next match)
 *   fixtures.yml                  — season fixtures (array)
 *   finals.yml                    — finals series (array)
 *   social.yml                    — WFNC social calendar (array of 18 rounds)
 *   sponsors.yml                  — sponsors by tier
 *   ladders/{slug}.yml            — one ladder per grade
 *   results/r{N}.yml              — one results round per file
 *   news/*.md                     — one article per markdown file
 */
import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

const CLUB_SLUGS = [
  'wallaroo', 'ardrossan', 'bute', 'central-yorke', 'cms',
  'kadina', 'moonta', 'paskeville', 'southern-eagles',
] as const;
const clubSlug = z.enum(CLUB_SLUGS);

// ──────────────────────────────────────────────────────────────
// site — singleton config for the homepage shell
// ──────────────────────────────────────────────────────────────
const site = defineCollection({
  loader: file('src/content/site.yml'),
  schema: z.object({
    season: z.number().int(),
    currentRound: z.number().int(),
    /** Display date for the top-strip pill (e.g. "Sat 16 May"). */
    currentDate: z.string(),
    /** Long-form date used in the hero next-match card. */
    nextMatchDate: z.string(),
    /** Senior bounce time, also shown in next-match card. */
    nextMatchBounce: z.string(),
    /** Venue label for the next match's primary listing. */
    nextMatchVenue: z.string(),
    /** Home or away — drives the next-match tag. */
    nextMatchHomeOrAway: z.enum(['HOME', 'AWAY']),
    /** Opponent slug for the next match (used to pull the crest). */
    nextMatchOpponent: clubSlug,
    nextMatchOpponentName: z.string(),
    nextMatchOpponentRecord: z.string(),
    /** Wallaroo's own record line shown next to the home crest. */
    ourRecord: z.string(),
    /** "This Week" section banner label, e.g. "AWAY ROUND" / "HOME ROUND". */
    thisWeekVenue: z.string(),
    thisWeekVenueLabel: z.string(),
  }),
});

// ──────────────────────────────────────────────────────────────
// fixtures — season fixtures (one file per round under src/content/fixtures/)
// ──────────────────────────────────────────────────────────────
const fixtures = defineCollection({
  loader: glob({ base: './src/content/fixtures', pattern: '*.yml' }),
  schema: z.object({
    round: z.number().int(),
    date: z.string(),
    type: z.enum(['match', 'bye']),
    oppSlug: clubSlug.optional(),
    oppName: z.string().optional(),
    venue: z.enum(['HOME', 'AWAY']).optional(),
    venueDetail: z.string().optional(),
    status: z.enum(['past', 'now', 'upcoming']).optional(),
  }),
});

// ──────────────────────────────────────────────────────────────
// thisWeekFixtures — multi-grade fixtures for the current round
// ──────────────────────────────────────────────────────────────
const thisWeekFixtures = defineCollection({
  loader: glob({ base: './src/content/this-week', pattern: '*.yml' }),
  schema: z.object({
    grade: z.string(),
    homeSlug: clubSlug,
    homeName: z.string(),
    awaySlug: clubSlug,
    awayName: z.string(),
    time: z.string(),
    ampm: z.enum(['AM', 'PM']),
    isHomeVenue: z.boolean(),
  }),
});

// ──────────────────────────────────────────────────────────────
// finals — finals series (one file per match)
// ──────────────────────────────────────────────────────────────
const finals = defineCollection({
  loader: glob({ base: './src/content/finals', pattern: '*.yml' }),
  schema: z.object({
    name: z.string(),
    date: z.string(),
    venue: z.string(),
    hostHere: z.boolean().optional(),
    grandFinal: z.boolean().optional(),
  }),
});

// ──────────────────────────────────────────────────────────────
// social — WFNC social calendar (one file per round)
// ──────────────────────────────────────────────────────────────
const social = defineCollection({
  loader: glob({ base: './src/content/social', pattern: '*.yml' }),
  schema: z.object({
    round: z.number().int(),
    date: z.string(),
    type: z.enum(['event', 'bye']),
    host: z.string().optional(),
    venue: z.string().optional(),
    featured: z.boolean().optional(),
    status: z.enum(['past', 'now', 'upcoming']).optional(),
  }),
});

// ──────────────────────────────────────────────────────────────
// sponsors — one file per sponsor; tier drives placement
// ──────────────────────────────────────────────────────────────
const sponsors = defineCollection({
  loader: glob({ base: './src/content/sponsors', pattern: '*.yml' }),
  schema: z.object({
    name: z.string(),
    tier: z.enum(['platinum', 'vip', 'gold', 'silver', 'bronze']),
    url: z.string().url().optional(),
    /** Display order within tier — smaller = first. Optional; alpha by default. */
    order: z.number().optional(),
  }),
});

// ──────────────────────────────────────────────────────────────
// ladders — one file per grade
// ──────────────────────────────────────────────────────────────
const ladders = defineCollection({
  loader: glob({ base: './src/content/ladders', pattern: '*.yml' }),
  schema: z.object({
    grade: z.string(),
    /** Short label for the tab (e.g. "Snr Colts"). Falls back to grade. */
    tabLabel: z.string().optional(),
    /** Display order on the homepage tab strip. */
    order: z.number().int(),
    /** What's in the last column: percentage (%) or premiership points. */
    columns: z.enum(['pct', 'pts']),
    afterRound: z.number().int(),
    rows: z.array(z.object({
      pos: z.number().int(),
      slug: clubSlug,
      team: z.string(),
      p: z.number().int(),
      w: z.number().int(),
      l: z.number().int(),
      pct: z.string().optional(),
      pts: z.number().optional(),
      highlight: z.boolean().optional(),
    })),
  }),
});

// ──────────────────────────────────────────────────────────────
// results — one file per round (multiple grades inside)
// ──────────────────────────────────────────────────────────────
const results = defineCollection({
  loader: glob({ base: './src/content/results', pattern: '*.yml' }),
  schema: z.object({
    round: z.number().int(),
    date: z.string(),
    games: z.array(z.object({
      grade: z.string(),
      homeName: z.string(),
      homeScore: z.string().optional(),
      awayName: z.string(),
      awayScore: z.string().optional(),
      margin: z.string().optional(),
      byeTeam: z.string().optional(),
    })),
  }),
});

// ──────────────────────────────────────────────────────────────
// news — markdown articles
// ──────────────────────────────────────────────────────────────
const news = defineCollection({
  loader: glob({ base: './src/content/news', pattern: '*.md' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(['RESULT', 'FIXTURE', 'FINALS', 'CLUB', 'JUNIORS', 'COMMUNITY']),
    date: z.coerce.date(),
    summary: z.string().optional(),
    image: z.string().optional(),
    href: z.string().optional(),
    pinned: z.boolean().optional(),
  }),
});

export const collections = {
  site,
  fixtures,
  thisWeekFixtures,
  finals,
  social,
  sponsors,
  ladders,
  results,
  news,
};
