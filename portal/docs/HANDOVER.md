# Handover — Templates library + Landing takeovers

Self-contained handover for continuing work on the Wallaroo FC Secretary Portal.
Repo: `tristanorre/wallaroofc`.

## Context

Since the monorepo refactor the layout is:

- `portal/` — Next.js 15 admin portal, TypeScript strict, Tailwind v4,
  `@supabase/ssr`. Deployed via the `wallaroofc-portal` Vercel project
  (root `portal/`) with `portal.wallaroofc.com` attached — see
  "Deployment status" below.
- `public/` — Astro 6 SSR site, deployed to `wallaroofc.com` (live).
- `supabase/migrations/` — shared Postgres schema against project
  `linaudktxwrqelngffol` in WallarooFC's Org (owner `admin@wallaroofc.com.au`).

Read `portal/reference/CLAUDE_CODE_PROMPT.md` and `README.md` for full brand +
build context before touching anything.

## Deployment status (verified 2026-07-02)

Two Vercel projects, both under team `admin-69071042's projects`:

- **Website** — `wallaroo-fc` (framework `astro`, root `public/`). Production
  READY on `main` with `wallaroofc.com` / `www.wallaroofc.com` attached. Live.
- **Portal** — `wallaroofc-portal` (framework `nextjs`, root `portal/`),
  created 2026-07-02. `portal.wallaroofc.com` is attached and PR preview
  deployments build READY. Confirm a production deployment from `main` and
  that `portal.wallaroofc.com` resolves before relying on the public
  widget/API endpoints.
- **Supabase MCP** — the Wallaroo DB (`linaudktxwrqelngffol`) is owned by
  `admin@wallaroofc.com.au`. If the MCP lists only unrelated orgs
  (ORRE/TAJJPI/TR Depledge/`orre-app`), it is signed into the wrong account —
  re-authenticate as `admin@wallaroofc.com.au` before applying anything.

## Feature summary

Two-part communications feature in the admin portal:

1. **Templates library** at `/(portal)/templates` — CRUD for reusable content.
   Every template stores `title` + `category` + `body` (jsonb) + optional
   `image_path`. Categories: `social_facebook`, `social_instagram`,
   `admin_letter`, `landing_takeover`. Body shape is a zod-discriminated union
   in `portal/src/lib/templates/types.ts` (social = text + hashtags;
   letter = markdown + signer; takeover = heading + body + CTA). Editable any
   time from `/templates/[id]`.
2. **Landing takeovers** at `/(portal)/takeovers` — schedule a
   `landing_takeover` template to render as a centred modal + dark backdrop on
   the public Astro site during a time window (Adelaide TZ). Pause/resume/cancel.
   One active takeover at a time, enforced at the UI (`windowsOverlap` in
   `portal/src/lib/takeovers/types.ts`) and the DB (BEFORE INSERT/UPDATE trigger
   using `tstzrange && tstzrange`).

Public-site integration is widget-script based so the Astro site stays untouched
apart from one `<script src>` tag:

- `GET /api/public/takeover/current` — CORS-open JSON,
  `{ takeover: null }` or the active template body.
- `GET /widget.js` — vanilla-JS bundle (no build step); fetches the API on load,
  injects a centred modal, animates in (slide-down + fade, 500ms), holds 10s,
  animates out. Fires on every landing-page visit. Dismiss via × or backdrop.
- Integration doc: `portal/docs/landing-takeover.md`.

## Files that matter (under `portal/` unless noted)

| Purpose | Path |
|---|---|
| Migration (not yet applied) | `supabase/migrations/005_templates_and_takeovers.sql` |
| Thursday Night seed (not yet applied) | `supabase/seeds/001_thursday_night.sql` |
| Zod schemas + types | `src/lib/templates/types.ts`, `src/lib/takeovers/types.ts` |
| Server actions | `src/lib/{templates,takeovers}/actions.ts` |
| Queries (RLS + service-role for public) | `src/lib/{templates,takeovers}/queries.ts` |
| Portal UI | `src/app/(portal)/templates/**`, `src/app/(portal)/takeovers/**` |
| Public API | `src/app/api/public/takeover/current/route.ts` |
| Widget | `src/app/widget.js/route.ts` |
| Docs | `docs/landing-takeover.md` |
| Tests (passing) | `src/lib/templates/types.test.ts`, `src/lib/takeovers/types.test.ts` |

Schema (in `005_templates_and_takeovers.sql`):

```
templates(id uuid, title text, category text, body jsonb, image_path text, created_by uuid, timestamps)
landing_takeovers(id uuid, template_id uuid FK, starts_at timestamptz, ends_at timestamptz,
                  is_paused bool, created_by uuid, timestamps, check ends_at > starts_at)
```

Plus `set_updated_at()` + `landing_takeovers_no_overlap()` triggers,
`has_portal_role()` helper, and RLS policies giving
secretary/president/treasurer/committee full CRUD.

## What needs doing next

0. **Confirm Supabase org** — run `list_projects` on the Supabase MCP and verify
   `wallaroo-fc` / `linaudktxwrqelngffol` appears before running any
   `apply_migration`. Re-auth as `admin@wallaroofc.com.au` if not.
1. **Apply migration 005** to `linaudktxwrqelngffol`.
2. **Seed** the Thursday Night templates
   (`supabase/seeds/001_thursday_night.sql`) after the migration is applied.
2b. **Confirm the portal is production-live** — the `wallaroofc-portal`
    Vercel project (root `portal/`, `portal.wallaroofc.com` attached) already
    exists and deploys. Verify a production deploy from `main`, that
    `portal.wallaroofc.com` resolves, and that env vars from
    `portal/src/env.ts` are set in that project. Steps 3–4 depend on the
    portal being reachable.
3. **Sanity check** — sign in at `/sign-in` (magic-link to an email on
   `ALLOW_LIST_EMAILS`, since Microsoft OAuth isn't wired), open `/templates`
   and `/takeovers`, schedule the Thursday Night takeover for a test window,
   then confirm `curl https://portal.wallaroofc.com/api/public/takeover/current`
   returns the template body during that window.
4. **Astro integration** — coordinate with whoever owns the `public/` app to add
   `<script src="https://portal.wallaroofc.com/widget.js" defer></script>` to the
   landing page `<head>`. Follow `portal/docs/landing-takeover.md`.

## Environment / CI notes

- Portal env vars validated by `@t3-oss/env-nextjs` in `portal/src/env.ts`.
  CI runs with `SKIP_ENV_VALIDATION=true`.
- The public-site CI job gates its Astro build on `PUBLIC_SUPABASE_URL` +
  `PUBLIC_SUPABASE_ANON_KEY` GitHub Actions secrets — see
  `.github/workflows/ci.yml`. Add those secrets to fully enable public-site CI.

## Deferred ideas / TODOs

- Per-takeover frequency (once-per-session vs every-visit) toggle in the
  schedule form (brief said every-visit).
- Preview of the takeover inside the portal (currently only visible on the
  public site once deployed).
- Analytics: log `takeover_view` / `takeover_dismissed` from the widget to a
  `takeover_events` table.
- MFA gate in `(portal)/layout.tsx` — deferred so `/mfa/enrol` doesn't
  self-loop; wire it once the sidebar shell lands.

## Read before starting

- `README.md` (repo root)
- `portal/reference/CLAUDE_CODE_PROMPT.md` (original build brief)
- `portal/docs/landing-takeover.md`
- `portal/src/lib/templates/types.ts`, `portal/src/lib/takeovers/types.ts`
- `supabase/migrations/005_templates_and_takeovers.sql`
- `supabase/seeds/001_thursday_night.sql`
