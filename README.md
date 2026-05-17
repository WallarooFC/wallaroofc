# Wallaroo FC Secretary Portal

Production portal for the Wallaroo Football Club Secretary. Deployed as a separate Next.js app at `portal.wallaroofc.com`, sitting alongside the public Wix site at `wallaroofc.com`.

The single v1 user is the Club Secretary. The portal replaces a sprawl of spreadsheets, manual PlayHQ-email-to-jumper workflows, and ad-hoc roster wrangling.

## Stack

- Next.js 15 (App Router, React Server Components, TypeScript strict)
- Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres + Auth + Storage) with RLS on every table
- Resend for email, Twilio for SMS (feature-flagged via `SMS_ENABLED`)
- Vercel for hosting + cron
- Vitest + React Testing Library for unit tests; Playwright for E2E
- pnpm

## Getting started

```bash
pnpm install
cp .env.local.example .env.local   # fill in real values
pnpm dev
```

Visit http://localhost:3000.

## Scripts

| Command           | Purpose                            |
| ----------------- | ---------------------------------- |
| `pnpm dev`        | Next.js dev server                 |
| `pnpm build`      | Production build                   |
| `pnpm typecheck`  | `tsc --noEmit`                     |
| `pnpm lint`       | ESLint                             |
| `pnpm test`       | Vitest unit tests                  |
| `pnpm test:watch` | Vitest in watch mode               |
| `pnpm test:e2e`   | Playwright E2E (starts dev server) |
| `pnpm format`     | Prettier write                     |

## Layout

```
/reference            Brief, mockups, seed data (immutable inputs)
/src
  /app                App Router routes (route groups arrive in commit 2)
  /lib
    /supabase         Server / browser / service-role client factories
    utils.ts          cn() helper
  env.ts              t3-env schema — app refuses to boot without required vars
/e2e                  Playwright specs
/.github/workflows    CI
```

## Environment

All env vars live in `.env.local` and are validated by `src/env.ts` (`@t3-oss/env-nextjs`). See `.env.local.example` for the schema. The app refuses to start if a required var is missing; set `SKIP_ENV_VALIDATION=true` only for `pnpm build` in CI.

## Brand

Tokens are defined in `src/app/globals.css` under `@theme` and exposed as Tailwind utilities (`bg-wfc-red`, `text-wfc-cream`, etc.). Source of truth for the brand system is in `reference/`.

| Token                                                      | Hex                               | Usage                                       |
| ---------------------------------------------------------- | --------------------------------- | ------------------------------------------- |
| `wfc-red`                                                  | `#C8102E`                         | Primary accent — CTAs only                  |
| `wfc-red-deep`                                             | `#8E0B20`                         | Button hover                                |
| `wfc-blue` / `wfc-blue-deep` / `wfc-blue-darkest`          | `#14315C` / `#0A1F3D` / `#050E1F` | Headers, hero gradient                      |
| `wfc-cream`                                                | `#F5F1E8`                         | Page background                             |
| `wfc-charcoal`                                             | `#15171C`                         | Body text                                   |
| `wfc-grey`                                                 | `#595D63`                         | Muted text (WCAG AA)                        |
| `wfc-line`                                                 | `#DAD3C2`                         | Dividers                                    |
| `wfc-status-green` / `wfc-status-amber` / `wfc-status-red` | `#3D7A3A` / `#C47B1F` / `#A8252B` | Status chips only — distinct from brand red |
