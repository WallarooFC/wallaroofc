# Wallaroo Football Club Website

The production website for [Wallaroo FC](https://wallaroofc.com.au/) — one of Australia's
oldest continuously running football clubs, founded at the Globe Inn (now the
Weeroona Hotel) on 17 June 1867.

A static Astro 6 site with 22 routes, content collections driving every weekly-editable
piece of data, Decap CMS for committee editing, and a build-time image pipeline
that turns 20 source photos into 119 responsive WebP variants.

## Three docs you probably want

| Audience | File | What's in it |
| --- | --- | --- |
| **Committee / content editors** | [`EDITING.md`](./EDITING.md) | How to update fixtures, ladders, results, news, sponsors via Decap CMS. No code knowledge needed. |
| **Whoever's deploying** | [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Cloudflare Pages setup, GitHub repo creation, DNS migration from Wix, Decap OAuth, Formspree IDs. One-off pass — then it's hands-off. |
| **Developer adding photos** | [`ASSETS.md`](./ASSETS.md) | Where logos and photos live. How to add a new club crest. How the image pipeline works. |

## Tech stack — decided once, no need to revisit

- **Astro 6** — static site generator; near-zero JavaScript
- **Tailwind 4** — design tokens via `@theme` in `src/styles/global.css`
- **TypeScript strict** — every content collection is Zod-validated at build
- **Decap CMS** — committee-facing editor at `/admin/`, Git-backed, free
- **Cloudflare Pages** — hosting, free tier, unlimited bandwidth
- **Formspree** — form submissions to `admin@wallaroofc.com.au`

Reasoning for the stack lives in the original handoff. Short version: this is a
volunteer-run country footy club site that should not need a developer touching
it for routine updates — only the committee.

## Local development

```sh
git clone <repo-url>
cd wallaroo-fc
npm install
npm run dev          # http://localhost:4321
```

Optional: run the CMS against your local working tree (instead of GitHub):

```sh
# Terminal 1
npm run dev
# Terminal 2
npx decap-server     # proxies Decap CMS edits to local git
```

Then visit `http://localhost:4321/admin/`. Useful when you want to test schema
changes without committing.

## Project structure

```
.
├── public/
│   ├── admin/                      # Decap CMS — config.yml + index.html
│   ├── robots.txt
│   └── favicon.svg
│
├── src/
│   ├── pages/                      # File-based routing — one file per route
│   │   ├── index.astro             # Homepage (the v14 design)
│   │   ├── fixtures/index.astro    # /fixtures/
│   │   ├── ladders/index.astro     # /ladders/
│   │   ├── results/index.astro
│   │   ├── social/index.astro
│   │   ├── sponsors/index.astro
│   │   ├── membership/index.astro
│   │   ├── juniors/index.astro
│   │   ├── volunteers/index.astro
│   │   ├── history/index.astro
│   │   ├── about/index.astro
│   │   ├── gallery/index.astro
│   │   ├── teams/[grade].astro     # Dynamic — one page per grade
│   │   └── news/[...slug].astro    # Dynamic — one page per article
│   │
│   ├── components/                 # 19 reusable Astro components
│   │   ├── Crest.astro             # Shared club crest with srcset + fetchpriority
│   │   ├── PageHero.astro          # Hero block for non-homepage routes
│   │   └── [...17 section components matching v14]
│   │
│   ├── layouts/
│   │   ├── Layout.astro            # Bare HTML shell — head, fonts, scripts
│   │   └── PageLayout.astro        # Layout + TopStrip + Masthead + Footer
│   │
│   ├── content.config.ts           # 9 Zod-validated content collections
│   ├── content/                    # YAML & markdown data (committee-editable)
│   │   ├── site.yml                # Singleton — current round / next match
│   │   ├── fixtures/r{1..18}.yml   # Season fixtures
│   │   ├── this-week/*.yml         # Per-grade fixtures for the current round
│   │   ├── finals/*.yml            # Finals series
│   │   ├── ladders/*.yml           # One per grade
│   │   ├── results/r{N}.yml        # One per played round
│   │   ├── news/*.md               # Markdown articles
│   │   ├── social/r{1..18}.yml     # WFNC social calendar
│   │   └── sponsors/*.yml          # 72 sponsors across 5 tiers
│   │
│   ├── assets/
│   │   ├── logos/                  # 9 YPFL club crests (Astro Image optimised)
│   │   └── photos/                 # 11 gallery photos
│   │
│   ├── lib/
│   │   ├── clubs.ts                # YPFL club registry + crest imports
│   │   ├── grades.ts               # Per-grade metadata (coaches, captains)
│   │   └── honour-roll.ts          # Life members + 150 games club
│   │
│   └── styles/global.css           # Design tokens (Tailwind @theme + legacy aliases)
│
└── scripts/                        # One-off maintenance scripts
    ├── extract-assets.mjs          # Pull base64 images from a v14-style mockup
    ├── rename-assets.mjs           # Map extracted hash names → semantic names
    ├── split-array-yamls.mjs       # Convert array YAMLs → folder collections
    └── import-sponsors.mjs         # Regenerate sponsor YAMLs from a JSON list
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server on `localhost:4321` |
| `npm run build` | Build to `./dist/` (Astro Image regenerates variants) |
| `npm run preview` | Serve the built `dist/` locally for smoke testing |
| `npx decap-server` | Local Decap CMS proxy (for offline content editing) |
| `npm run astro check` | Run the TypeScript type-checker on `.astro` files |

## What the design system looks like

All design tokens are CSS variables defined in `src/styles/global.css`:

```css
--red: #C8102E       --blue-deep: #0A1F3D     --display: 'Anton'
--red-deep: #8E0B20  --blue-darkest: #050E1F  --headline: 'Bebas Neue'
--blue: #14315C      --cream: #F5F1E8         --serif: 'Fraunces'
--white: #FFFFFF     --charcoal: #15171C      --body: 'Inter'
--grey: #595D63      --line: #DAD3C2
```

Component CSS is scoped via Astro's built-in `<style>` blocks. Tailwind utilities
are available everywhere as a fallback for one-off layout tweaks.

## Lighthouse baseline (mobile, simulated 4G, gzip-compressed)

| Page | Perf | A11y | BP | SEO |
| --- | ---: | ---: | ---: | ---: |
| `/` | 84 | 100 | 100 | 100 |
| `/fixtures/` | 100 | 100 | 100 | 100 |
| `/ladders/` | 100 | 100 | 100 | 100 |
| `/teams/a-grade/` | 92 | 100 | 100 | 100 |
| `/membership/` | 100 | 100 | 100 | 100 |
| `/volunteers/` | 100 | 100 | 100 | 100 |
| `/about/` | 88 | 100 | 100 | 100 |
| `/history/` | 87 | 100 | 100 | 100 |
| `/sponsors/` | 89 | 100 | 100 | 100 |

The homepage Perf sits at 84 because the v14-faithful design has a ~1,450-element
DOM that the simulated 4G CPU throttle can't paint in under 2.5s. On real devices
on real networks the score sits above 90. The brief acknowledges this — see the
Wave 1 handoff for the alternative of trimming the homepage to summary cards.

## Editing workflow at a glance

1. Committee member visits `wallaroofc.com.au/admin/`, logs in with GitHub
2. Picks a section (Fixtures, Ladders, Results, News, Social, Sponsors, …)
3. Clicks an entry, edits the form, hits Save → Publish
4. Decap commits the change to GitHub
5. Cloudflare Pages auto-rebuilds — change is live in ~90 seconds

See [`EDITING.md`](./EDITING.md) for the committee-facing version of this.

## License

Source code is private to Wallaroo Football Club. Match-day photos and the
bulldog crest remain the property of the club.
