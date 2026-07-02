# Wallaroo FC — website

Astro 6 SSR site for **wallaroofc.com** — club homepage, fixtures, results, ladders, sponsors, gallery, plus the password-protected **admin** section at `/admin`.

| Path | Stack | URL |
|------|-------|-----|
| `public/` | Astro 6 · Supabase · Vercel | wallaroofc.com |

The site (and its `/admin` area) is backed by Supabase project `linaudktxwrqelngffol`. Migrations live in `supabase/migrations/`.

## Getting started

```bash
cd public
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

Visit http://localhost:4321.

## Admin

The admin area lives inside the site at `/admin` (login at `/admin/login`, Supabase Auth). Pages: dashboard, players, fixtures, results, ladders, sponsors, roster, canteen, config, gallery, members, news, qualifications, secretary.

## Deploy

Hosted on Vercel (project `wallaroo-fc`, root directory `public/`). Pushes to `main` auto-deploy to production (wallaroofc.com + www.wallaroofc.com).

## Data

Live fixture/ladder/results data syncs from the PlayHQ public GraphQL API (Wallaroo org `55ab4e41-1c1e-411f-99a4-d9255f2c87a5`) into Supabase via scheduled endpoints under `public/src/pages/api/sync/`.
