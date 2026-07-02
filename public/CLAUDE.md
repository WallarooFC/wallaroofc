# Wallaroo FC — Claude Code Project Guide

## What this is
Full-stack website + committee management platform for Wallaroo Football Club (est. 1867),
competing in the Yorke Peninsula Football League (YPFL), South Australia.

**Live site:** https://wallaroofc.com.au  
**Stack:** Astro 6 (hybrid SSR) · Supabase · Vercel · PlayHQ integration

---

## Architecture

```
src/
  pages/          Public site pages (static by default)
  pages/admin/    Committee portal (server-rendered, auth-gated)
  pages/api/      API routes (server-rendered)
  components/     Astro UI components
  layouts/        Layout wrappers
  lib/            Shared utilities (supabase client, playhq, helpers)
  styles/         global.css (design tokens)
  content/        YAML/MD content collections (legacy — migrating to Supabase)

supabase/
  migrations/     SQL migration files (run in order)
  functions/      Edge functions (PlayHQ sync cron)
```

---

## Brand & Design System

### Colours
| Token        | Hex       | Usage                                      |
|--------------|-----------|--------------------------------------------|
| `--red`      | `#C8102E` | Primary accent — CTAs, borders, highlights |
| `--red-deep` | `#8E0B20` | Button hover states                        |
| `--blue`     | `#14315C` | Mid blue — nav headers, card headers       |
| `--blue-deep`| `#0A1F3D` | Deep blue — hero sections, dark panels     |
| `--blue-darkest` | `#050E1F` | Darkest background — hero base         |
| `--white`    | `#FFFFFF` | Text on dark backgrounds                   |
| `--cream`    | `#F5F1E8` | Page background, card fills                |
| `--charcoal` | `#15171C` | Body text on light backgrounds             |
| `--grey`     | `#595D63` | Secondary/muted text (WCAG AA compliant)   |
| `--line`     | `#DAD3C2` | Dividers, borders on light backgrounds     |

### Typography
| Token       | Font       | Usage                                    |
|-------------|------------|------------------------------------------|
| `--display` | Anton      | Hero titles, large display numbers       |
| `--headline`| Bebas Neue | Nav, labels, buttons, eyebrows           |
| `--serif`   | Fraunces   | Body copy, lede paragraphs, italic accents |
| `--body`    | Inter      | General UI text                          |

### Design Principles
- Dark hero sections: `var(--blue-darkest)` → `var(--blue-deep)` gradient
- `#C8102E` is the sole accent colour — never competing accents
- Borders on dark: `3px solid var(--red)` emphasis / `2px solid rgba(255,255,255,0.12)` subtle
- Buttons: primary = red fill + white text; ghost = transparent + white border
- Sponsor logos on dark: `filter: brightness(0) invert(1)` to make them white
- Section padding: `80px 32px` desktop · `48px 24px` mobile
- Max content width: `1400px` centred with `margin: 0 auto`

---

## Supabase

### Environment variables required
```
PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server-only, never expose to client
PLAYHQ_ORG_ID=                     # YPFL organisation ID in PlayHQ
PLAYHQ_COMPETITION_ID=             # Current season competition ID
```

### Supabase client usage
```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Public client (browser + server public routes)
export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
)

// Admin client (server-only API routes)
export const supabaseAdmin = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
)
```

### Key tables
| Table                | Description                                  |
|----------------------|----------------------------------------------|
| `profiles`           | Committee members (linked to auth.users)     |
| `fixtures`           | All rounds from PlayHQ (auto-synced)         |
| `results`            | Game results per round (auto-synced)         |
| `ladders`            | Grade ladder rows (auto-synced)              |
| `players`            | Registered players from PlayHQ               |
| `sponsors`           | Sponsor records with tier/logo               |
| `news`               | News articles                                |
| `qualifications`     | Training certs & WWC checks per volunteer    |
| `bar_roster`         | Bar shift assignments                        |
| `social_events`      | Social calendar entries                      |

---

## PlayHQ Integration

Club has admin login to PlayHQ (playhq.com).
YPFL competition data is synced via a Vercel cron job → Supabase edge function.

PlayHQ API base: `https://www.playhq.com/api/`
Auth: Bearer token obtained from admin credentials.

Key endpoints:
- `GET /org/{orgId}/competitions`
- `GET /org/{orgId}/competitions/{id}/rounds`
- `GET /org/{orgId}/competitions/{id}/ladder`
- `GET /org/{orgId}/registrations` (player registrations)

---

## Admin Portal (`/admin`)

Protected by Supabase Auth. All `/admin/*` routes check session in middleware.
Middleware location: `src/middleware.ts`

### Roles (stored in `profiles.role`)
- `admin` — full access (president, secretary)
- `committee` — read most, limited write
- `volunteer` — bar roster only

### Portal sections
- `/admin` — dashboard (round summary, alerts)
- `/admin/fixtures` — manage fixture data
- `/admin/results` — enter/edit results
- `/admin/players` — player list from PlayHQ
- `/admin/qualifications` — training certs & WWC tracking
- `/admin/roster` — bar shift builder
- `/admin/sponsors` — sponsor management
- `/admin/news` — news article CMS
- `/admin/members` — committee member management

---

## Development commands
```bash
npm run dev        # local dev server (port 4321)
npm run build      # production build
npm run preview    # preview production build
```

## Deployment
Push to `main` on GitHub → Vercel auto-deploys.
Environment variables set in Vercel dashboard (never commit .env).
