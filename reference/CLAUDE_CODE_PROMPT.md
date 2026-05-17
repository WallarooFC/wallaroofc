# Wallaroo FC Secretary Portal — Build Brief for Claude Code

## Mission

Build a production-ready web portal for the Wallaroo Football Club Secretary. The portal sits behind the existing public website at `wallaroofc.com.au` and lives at `wallaroofc.com.au/portal` (deployed as a separate Next.js app, routed via the public site's reverse proxy or as a subdomain `portal.wallaroofc.com.au` — make this configurable via env var).

The single user for v1 is **Thomas Depledge**, Club Secretary, who signs in with `secretary@wallaroofc.com.au` (Microsoft 365). The portal replaces a sprawl of spreadsheets, manual PlayHQ-email-to-jumper-number workflows, and ad-hoc roster wrangling.

**Reference files** (place in `/reference/` in the repo before starting):
- `wfc-secretary-hub.html` — dashboard mockup, the design spec for look and feel
- `wfc-portal-signin.html` — sign-in mockup
- `WFC_2026_Members__Players.xlsx` — Thomas's current data (members, players, sponsors, WWCC, trainers) — use for the seed script
- `Wallaroo_Football_Club.png` — club crest, use as the favicon and sidebar logo

Build to **match the visual design of the mockups exactly** — colours, typography, layout, density. Do not redesign.

---

## Tech stack (non-negotiable for v1)

- **Framework**: Next.js 15, App Router, TypeScript (strict mode), React Server Components by default
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Fonts**: Bebas Neue (display), Fraunces (serif), JetBrains Mono (mono), Inter (body) — load via `next/font/google`
- **Database**: Supabase (Postgres) with Row Level Security enabled on every table
- **Auth**: Supabase Auth — Microsoft OAuth primary, magic-link email fallback. Enforce MFA via Supabase TOTP enrolment on first sign-in
- **Email send**: Resend (free tier covers v1)
- **SMS send**: Twilio (Australia number, pay-per-message)
- **File storage**: Supabase Storage (sponsor pack PDFs, minutes documents, milestone photos)
- **Hosting**: Vercel (production)
- **Date/time**: date-fns + date-fns-tz with `Australia/Adelaide` timezone everywhere
- **Forms**: react-hook-form + zod
- **Tables**: TanStack Table v8
- **Background jobs**: Vercel Cron for daily compliance sweeps; Resend inbound webhook for PlayHQ email parsing
- **Env validation**: t3-env (`@t3-oss/env-nextjs`)
- **Package manager**: pnpm

Do not introduce additional libraries unless absolutely necessary. If you do, comment why in the PR.

---

## Visual identity — extract from the mockup exactly

```
--wfc-navy:#0d1b3d
--wfc-navy-deep:#070f24
--wfc-gold:#d4a233
--wfc-gold-soft:#e8c878
--wfc-cream:#f4ead4
--wfc-paper:#fbf6e9
--wfc-red:#a8252b
--wfc-green:#3d7a3a
--wfc-amber:#c47b1f
--wfc-grey:#6b6557
--wfc-line:rgba(13,27,61,0.12)
--wfc-line-strong:rgba(13,27,61,0.28)
```

Configure these as Tailwind theme tokens (`wfc-navy`, `wfc-gold`, etc.) and use throughout. Body background is `wfc-paper` with the subtle ledger-line gradient from the mockup. Cards are white with `wfc-line` borders. Sidebar is `wfc-navy` with `wfc-cream` text. Hero sections use the navy-to-deep gradient with a 4px gold border-bottom. Status chips: green = ok, amber = warn, red = bad, exactly per the mockup.

---

## Database schema

Create Supabase migrations under `/supabase/migrations/`. Every table has `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()` (with a trigger that updates `updated_at`). Enable RLS on every table. For v1 the policy is "any authenticated user with role `secretary` can do everything"; write policies so adding `treasurer`, `president`, `coach` roles later is data, not a migration.

### Core

**`profiles`** — extends `auth.users`
- `user_id uuid primary key references auth.users(id) on delete cascade`
- `full_name text not null`
- `role text not null check (role in ('secretary','president','treasurer','coach','committee','viewer'))`
- `phone text`
- `signature_block text` — for outgoing emails

**`members`**
- `member_number text unique` (nullable — sponsors may not have one initially)
- `member_type text not null check (member_type in ('life','senior','junior','gold_sponsor','silver_sponsor','bronze_sponsor','vip','honorary','other'))`
- `first_name text not null`
- `last_name text not null`
- `email text`
- `phone text`
- `postal_address text`
- `prefers_post boolean default false`
- `prefers_email boolean default true`
- `joined_year int`
- `paid_current_season boolean default false`
- `notes text`
- `playhq_participant_id text` (nullable)

Indexes: `(last_name, first_name)`, `(member_type)`, `(paid_current_season)`.

**`players`**
- `member_id uuid references members(id) on delete cascade`
- `squad text not null check (squad in ('seniors','reserves','snr_colts','jnr_colts','u11s','u9s'))`
- `dob date`
- `year_in_grade text check (year_in_grade in ('first','middle','last','last_exempt'))` — juniors only
- `guardian_name text`
- `guardian_phone text`
- `guardian_email text`
- `health_flags text` — free text (ADHD, ASD, asthma, allergies)
- `position_preference text`
- `jumper_number int`
- `jumper_status text default 'pending' check (jumper_status in ('pending','suggested','confirmed','retired'))`
- `last_season_jumper int`
- `playhq_registered_at timestamptz`
- `registered_current_season boolean default false`
- `games_played int default 0`
- `games_played_seniors int default 0`

Unique partial index: `(squad, jumper_number) where jumper_number is not null`.

**`jumper_allocation_queue`** — backs the PlayHQ Inbox view
- `player_id uuid references players(id) on delete cascade`
- `received_at timestamptz not null default now()`
- `source text default 'playhq_email'`
- `raw_email_id text` (Resend webhook payload id, for traceability)
- `suggested_number int`
- `suggested_reason text` — e.g. "next available", "returning · last yr #31", "requested #27"
- `status text default 'pending' check (status in ('pending','allocated','dismissed'))`
- `resolved_at timestamptz`
- `resolved_by uuid references auth.users(id)`

### Compliance

**`compliance_records`**
- `member_id uuid references members(id) on delete cascade`
- `cert_type text not null check (cert_type in ('wwcc','first_aid','rsa','trainer_level_0','trainer_level_1','trainer_level_2','coach_accred','other'))`
- `cert_number text`
- `issued_date date`
- `expiry_date date`
- `evidence_file_path text` — Supabase Storage path
- `notes text`
- `last_reminder_sent_at timestamptz`

Index: `(expiry_date)` for the daily sweep.

### Match day & rosters

**`fixtures`**
- `round_number int`
- `match_date date not null`
- `home_away text check (home_away in ('home','away'))`
- `opponent text`
- `venue text`
- `grade text check (grade in ('seniors','reserves','snr_colts','jnr_colts','u11s','u9s'))`
- `notes text`

**`roster_shifts`**
- `fixture_id uuid references fixtures(id) on delete cascade`
- `role text not null check (role in ('gate','bar','canteen','goal_umpire','timekeeper','first_aid','runner','boundary_umpire'))`
- `start_time time`
- `end_time time`
- `slots_required int not null default 1`
- `requires_rsa boolean default false`
- `requires_first_aid boolean default false`
- `notes text`

**`roster_assignments`**
- `shift_id uuid references roster_shifts(id) on delete cascade`
- `member_id uuid references members(id) on delete set null`
- `status text default 'invited' check (status in ('invited','confirmed','declined','no_response'))`
- `invited_at timestamptz`
- `responded_at timestamptz`
- `reminder_count int default 0`

### Sponsors

**`sponsor_packs`**
- `member_id uuid references members(id)` — the sponsor (must be a `*_sponsor` member_type)
- `season int not null`
- `pack_status text default 'to_build' check (pack_status in ('to_build','built','scheduled','delivered','overdue'))`
- `contents jsonb` — `[{item:"jersey", qty:1}, {item:"season_pass", qty:4}, {item:"meal_voucher", qty:6}, ...]`
- `scheduled_delivery date`
- `delivered_at date`
- `delivered_by uuid references auth.users(id)`
- `signed_receipt_path text`
- `notes text`

### Milestones

**`milestones`**
- `player_id uuid references players(id) on delete cascade`
- `milestone_type text check (milestone_type in ('50_games','100_games','150_games','200_games','250_games','300_games','life_member','other'))`
- `target_game_count int`
- `projected_fixture_id uuid references fixtures(id)`
- `status text default 'upcoming' check (status in ('upcoming','imminent','completed','passed'))`
- `jumper_ordered boolean default false`
- `presentation_planned boolean default false`
- `media_release_sent boolean default false`
- `notes text`

### Finance

**`bulldogs_dollars`** — meal voucher / sponsor voucher ledger
- `member_id uuid references members(id)` — beneficiary
- `voucher_code text unique` — for QR
- `amount_aud numeric(8,2) not null`
- `issued_reason text` — e.g. "gold sponsor pack", "milestone gift"
- `issued_at timestamptz default now()`
- `redeemed_at timestamptz`
- `redeemed_at_point text` — "bar" / "canteen"
- `redeemed_amount numeric(8,2)`

**`gate_takings`**
- `fixture_id uuid references fixtures(id)`
- `cash_amount numeric(8,2) default 0`
- `eftpos_amount numeric(8,2) default 0`
- `adults_count int default 0`
- `concessions_count int default 0`
- `kids_count int default 0`
- `notes text`
- `recorded_at timestamptz default now()`
- `recorded_by uuid references auth.users(id)`

### Governance

**`agendas`**
- `meeting_date date not null`
- `meeting_type text default 'committee' check (meeting_type in ('committee','sub_committee','agm','sgm'))`
- `agenda_markdown text`
- `minutes_markdown text`
- `attendees jsonb` — array of profile ids + apologies
- `published boolean default false`

**`action_items`**
- `agenda_id uuid references agendas(id) on delete cascade`
- `description text not null`
- `assigned_to uuid references auth.users(id)`
- `due_date date`
- `status text default 'open' check (status in ('open','in_progress','done','cancelled'))`

### Audit

**`activity_log`**
- `actor uuid references auth.users(id)`
- `entity_table text not null`
- `entity_id uuid`
- `action text not null` — 'create' | 'update' | 'delete' | 'allocate_jumper' | etc.
- `diff jsonb`
- `at timestamptz default now()`

Insert a row from every mutation. This is the secretary's defence if anyone questions a decision later.

---

## Routes & pages

App Router structure under `/app/`:

```
/app
  /(public)
    /sign-in/page.tsx        ← matches wfc-portal-signin.html
    /sign-in/callback/route.ts (OAuth callback)
  /(portal)
    /layout.tsx              ← shell with sidebar + topbar + architecture strip
    /page.tsx                ← dashboard, matches wfc-secretary-hub.html
    /playhq-inbox/page.tsx
    /members
      /page.tsx              ← table view, filter by type
      /[id]/page.tsx         ← detail + edit
      /new/page.tsx
    /players
      /page.tsx              ← roster by squad, with jumper numbers
      /[id]/page.tsx
      /jumpers/page.tsx      ← jumper number map per squad
    /milestones/page.tsx
    /sponsors
      /page.tsx
      /packs/page.tsx        ← pack tracker
    /fixtures
      /page.tsx
      /[id]/page.tsx         ← fixture detail with roster
    /rosters/page.tsx        ← week-at-a-glance of all roster shifts
    /bar-bulldogs/page.tsx
    /gate/page.tsx
    /compliance/page.tsx
    /agendas
      /page.tsx
      /[id]/page.tsx         ← markdown editor for agenda + minutes
    /comms/page.tsx          ← mail-merge composer
    /settings/page.tsx
  /api
    /inbound-email/route.ts  ← Resend webhook for PlayHQ parsing
    /sms-webhook/route.ts    ← Twilio inbound for roster RSVPs
    /cron/daily-sweep/route.ts ← compliance expiries, milestone updates
    /cron/match-day-pack/route.ts
    /cron/roster-chase/route.ts
    /public/feed/route.ts    ← JSON feed consumed by wallaroofc.com.au
```

The dashboard at `/(portal)/page.tsx` must reproduce every card in `wfc-secretary-hub.html`:

1. Hero with greeting + 5-stat pulse strip
2. Attention Required feed (top 7 items, computed from real data)
3. Membership Mix donut
4. Compliance Snapshot (4-tile strip)
5. PlayHQ Inbox · Jumper Allocation table
6. Automations Running panel
7. Integration Stack
8. Upcoming Deadlines
9. Game Milestones
10. Sponsor Pack Tracker
11. Match Day Rd N Roster

Every card pulls live data from Supabase via Server Components. The "Attention Required" feed is computed by `lib/attention.ts` which aggregates: pending PlayHQ allocations, compliance expiries < 30 days, overdue sponsor packs, unfilled roster shifts < 7 days out, upcoming milestones < 30 days, unpaid memberships > 30 days overdue.

---

## The PlayHQ → Jumper workflow (the most important feature)

This is the single highest-value automation. Build it carefully.

### Inbound flow

1. PlayHQ sends rego notification emails to `playhq-inbox@wallaroofc.com.au` (an alias forwarded to a Resend inbound address)
2. `/api/inbound-email` receives the parsed email payload from Resend's webhook
3. Parser at `lib/playhq/parse-rego-email.ts` extracts: participant name, DOB, squad/grade, contact details, guardian (if junior), requested jumper number if mentioned
4. Find or create the matching `members` row (match on name + DOB; if ambiguous, queue for manual review)
5. Find or create the `players` row, set `playhq_registered_at = now()`
6. Insert into `jumper_allocation_queue` with a suggested number from `lib/jumpers/suggest.ts`:
   - If player has a `last_season_jumper` and it's currently free in their squad → suggest it, reason "returning · last yr #X"
   - Else if the email contained a requested number and it's free → suggest it, reason "requested #X"
   - Else next available number in the squad's range → "next available"
7. Send a Resend notification email to `secretary@wallaroofc.com.au` with deep link to the inbox

### Allocate action

On the inbox page, the secretary clicks **Allocate** on a row:
1. Optionally adjusts the suggested number
2. On submit: `players.jumper_number = N`, `players.jumper_status = 'confirmed'`, `jumper_allocation_queue.status = 'allocated'`
3. Auto-generate the next member number (next sequential `M-NNN` based on `max(member_number)`) and assign it
4. Send a Resend email to the player confirming their number, with the season fees breakdown
5. Append a row to the **jumper order list** (a generated CSV the secretary can download)
6. Write to `activity_log`

Server actions only — no API routes for mutations. Use `revalidatePath` after each mutation.

Provide a "manual entry" fallback on the inbox page for the case where Thomas wants to add a player who registered some other way.

---

## Authentication & access

- Sign-in page exactly matches `wfc-portal-signin.html`
- Primary: Microsoft OAuth via Supabase. Restrict the OAuth tenant to the `wallaroofc.com.au` domain
- Fallback: magic-link email (Supabase default), restricted to a hard-coded allow-list in `lib/auth/allow-list.ts` for v1
- On first sign-in, force TOTP enrolment before any other page loads
- Middleware at `/middleware.ts` protects the entire `(portal)` route group; unauthenticated → `/sign-in`
- `profiles.role` controls access. For v1, only `secretary` exists in the data; build the policy structure for the others
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client; server-only

---

## Background jobs (Vercel Cron)

Configure in `vercel.json`:

- **Daily 6am Adelaide** (`/api/cron/daily-sweep`):
  - Sweep `compliance_records.expiry_date` — for each cert expiring in 60/30/14/7/1 days, send a reminder email to the member if not already sent in the last 7 days (track in `last_reminder_sent_at`)
  - Update `milestones.status` to `imminent` when `target_game_count - games_played_seniors <= 3`
  - Mark `sponsor_packs.pack_status = 'overdue'` when `scheduled_delivery < today` and not delivered
- **Friday 5pm Adelaide** (`/api/cron/match-day-pack`):
  - For each fixture on the upcoming Saturday, generate a PDF "match-day pack" (roster, health flags, contacts, opponent details) and email to coaches + the secretary
- **Hourly 9am–6pm match-day Saturday** (`/api/cron/roster-chase`):
  - For roster_assignments where `status='invited'` and `invited_at > 24h ago`, send a reminder SMS via Twilio, increment `reminder_count`

All cron endpoints must verify the `CRON_SECRET` header per Vercel docs.

---

## SMS & email

**Email** (`lib/email/`):
- `send.ts` — wraps Resend, accepts `{to, template, data}` shape
- `/templates/` — typed React Email components: `MembershipReminder`, `JumperConfirmation`, `WWCCExpiry`, `RosterInvite`, `MilestoneCongrats`, `SponsorPackReceipt`
- Every send goes through `lib/email/send.ts` so it can be batched, rate-limited, and audited

**SMS** (`lib/sms/`):
- `send.ts` — wraps Twilio
- Australian number formatting helper — accept `04xx xxx xxx` or `+614xxxxxxxx`, normalise to E.164
- All sends logged to `activity_log` with cost estimate
- Inbound `/api/sms-webhook` parses replies: "YES"/"Y"/"OK" → confirm assignment; "NO"/"N" → decline + auto-invite next on the rotation

---

## Seed script

`/scripts/seed.ts` (run with `pnpm seed`):
1. Read `reference/WFC_2026_Members__Players.xlsx`
2. Normalise data quirks — flag (don't silently fix) ambiguous rows like a member with multiple numbers concatenated in one cell, or sponsors with no member number
3. Insert members, players, compliance_records
4. Create Thomas's `profiles` row with role='secretary' (the dev creates his auth user via Supabase dashboard, then links by email)
5. Insert ~5 realistic fixtures for the 2026 season for testing the dashboard
6. Insert mock `jumper_allocation_queue` rows so the inbox isn't empty in dev

Idempotent — running it twice doesn't duplicate.

---

## Build order — do these in sequence

1. **Project scaffold** — Next.js + Tailwind + shadcn/ui + Supabase client setup, env validation, fonts, theme tokens. Confirm the dashboard skeleton renders the navy/gold look from the mockup before touching data
2. **Auth + middleware** — sign-in page, Microsoft OAuth, magic-link fallback, MFA enrolment, middleware-protected portal group
3. **Migrations + seed** — every table above, RLS policies, seed script working from the xlsx
4. **Dashboard shell** — sidebar, topbar, architecture strip, hero — matching mockup
5. **Members CRUD** — list, detail, new, edit. Use TanStack Table with filter/sort
6. **Players + jumpers** — roster view by squad, jumper map, edit
7. **PlayHQ inbox + allocation workflow** — manual entry first, then inbound email parser
8. **Compliance** — table + the 4-tile dashboard strip + daily sweep cron
9. **Fixtures + rosters** — fixture list, fixture detail with shift management, roster page
10. **Sponsors + packs** — list, pack tracker, delivery marking
11. **Milestones** — auto-compute from `players.games_played_seniors`, surface in dashboard
12. **Bulldogs $ ledger** — voucher issue, QR generation, redemption webhook
13. **Gate takings** — simple form, Square integration deferred
14. **Agendas + minutes** — markdown editor (react-markdown + a simple editor), action items
15. **Comms / mail-merge** — composer with segment picker, Resend send
16. **Cron jobs** — daily sweep, match-day pack, roster chase
17. **Audit log viewer** at `/settings/audit`
18. **Polish pass** — empty states, loading states, error boundaries, mobile responsive (Thomas will use this on his phone at the ground)

After each step run `pnpm typecheck && pnpm lint && pnpm test` and commit. Do not move to the next step with a failing build.

---

## Environment variables

`.env.local.example` with:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_PORTAL_URL=https://wallaroofc.com.au/portal
NEXT_PUBLIC_PUBLIC_SITE_URL=https://wallaroofc.com.au
RESEND_API_KEY=
RESEND_FROM_EMAIL=secretary@wallaroofc.com.au
RESEND_INBOUND_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
CRON_SECRET=
MICROSOFT_OAUTH_CLIENT_ID=
MICROSOFT_OAUTH_CLIENT_SECRET=
MICROSOFT_OAUTH_TENANT_ID=
ALLOW_LIST_EMAILS=secretary@wallaroofc.com.au,president@wallaroofc.com.au
```

Validate all of these with t3-env on boot. The app must refuse to start if a required var is missing.

---

## Quality bar

- TypeScript strict, no `any` without a comment explaining, no `@ts-ignore`
- Every Server Action validated with zod
- Every mutation writes to `activity_log`
- Every database write goes through a typed Supabase client (`/lib/db/`) — no raw SQL in components
- Mobile responsive — Thomas will use this from the boundary line on a Saturday
- Accessible — Radix primitives via shadcn, keyboard navigation, visible focus states
- All copy in plain English, matches the warmth of the mockup ("Morning, Thomas — three things need you today")
- No mock data in production code paths — if there's no real data, show empty states with a clear next action

---

## Out of scope for v1 (do not build, but leave hooks)

- Treasurer / President / Coach roles — schema supports them; don't build the views
- Player / parent-facing portal — separate app later
- Public website integration (sponsor logos, fixture feed pushed to wallaroofc.com.au) — leave a documented webhook endpoint `/api/public/feed` returning JSON; the website team consumes it
- Native mobile app — PWA is enough for v1
- Square POS integration — `gate_takings` is manual entry only; add the integration in v2

---

## First message to send back

When you start, your first response should be:
1. Confirm you've read this brief and the four reference files (or list which are missing)
2. List any ambiguities you want resolved before scaffolding — be specific
3. Propose the first 3 commits (scaffold, auth, theme) and ask for go-ahead
4. **Do not write any code yet** — wait for the green light

Then build step by step, committing after each numbered build-order item, asking before introducing any new dependency, and stopping if anything in the brief turns out to be wrong rather than guessing.
