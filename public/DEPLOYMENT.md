# Deployment

This is the one-time setup guide. Once it's done you shouldn't need to touch any
of it again — the committee can update content via the admin panel, Cloudflare
rebuilds automatically, and routine deployments are zero-effort.

If anything in here is unclear, the developer's email is in the repo's git log.

## 0 · Before you start, decide two things

1. **Which domain?** The brief specified `wallaroofc.com.au`, but the existing
   site lives at `wallaroofc.com`. Both appear to be owned (the email at
   `admin@wallaroofc.com.au` works today). Pick which one the new site sits at —
   the `site:` field in `astro.config.mjs` and every canonical URL/OG tag points
   at it. Currently set to `https://wallaroofc.com.au`.
2. **Which membership tier scheme?** `src/pages/membership/index.astro` ships
   the brief's scheme (Family/Single/Long Distance/Player Family/Patron). The
   live site uses a donation-tier scheme (Platinum $500 / Gold $300 / Silver $200
   / Bronze $100 / Social $50). Check with the committee before launch.

The rest of this doc assumes you've answered both.

## 1 · GitHub repo

The site needs to live in a GitHub repo for both Cloudflare to build from and
for Decap CMS to edit.

```bash
# From the project root
git remote add origin https://github.com/YOUR_ORG/wallaroofc.com.au.git
git push -u origin main
```

The repo can be public or private — both work with Decap. Public makes the
git history viewable to anyone, which is fine for a club site.

### Update the Decap config

Open `public/admin/config.yml` and replace the placeholder on line 11:

```yaml
backend:
  name: github
  repo: REPO_PLACEHOLDER          # ← replace with e.g. wallaroofc-au/wallaroofc.com.au
```

Commit that change. The admin panel will start working from `/admin/` once the
site is deployed.

## 2 · Cloudflare Pages

1. Sign in at [pages.cloudflare.com](https://pages.cloudflare.com/)
2. **Create application → Pages → Connect to Git**
3. Select the GitHub repo
4. Configure the build:

   | Setting | Value |
   | --- | --- |
   | Framework preset | Astro |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Node version | `22` (set via `NODE_VERSION` env var) |
   | Root directory | (leave blank) |

5. **Save and Deploy.** The first build takes ~2–3 minutes. Subsequent builds
   ~90 seconds (Astro image cache makes everything subsequent runs fast).

You should now see the site at `wallaroofc-com-au.pages.dev` (or whatever
Cloudflare assigns). Verify it looks right before moving on.

## 3 · Custom domain + DNS migration from Wix

The existing site at `wallaroofc.com` is on Wix. Migration steps depend on
which domain you're moving:

### If migrating wallaroofc.com.au (currently used only for email)

1. In Cloudflare Pages → **Custom domains → Set up a custom domain**
2. Enter `wallaroofc.com.au` and `www.wallaroofc.com.au`
3. Cloudflare will show DNS records to add at your registrar (probably
   Crazy Domains or similar Australian registrar)
4. Add the CNAME / A records as shown. **Do not change the MX records** — those
   should keep pointing at the email host (likely Google Workspace or whoever
   currently delivers `admin@wallaroofc.com.au`)
5. Wait for DNS propagation (15–60 minutes; up to 24 hours in rare cases)

### If migrating wallaroofc.com (currently the live website)

This is the higher-risk path because the live site goes down briefly during the
cutover. Recommended sequence:

1. Set up the Cloudflare Pages site as above and verify it works at the
   `*.pages.dev` URL
2. Log into the Wix dashboard, **export any content** you want to keep that
   isn't already in the new site (committee photos, archive documents, PDFs,
   etc.)
3. At the domain registrar that controls `wallaroofc.com`:
   - **Save the existing DNS records** somewhere safe (screenshot the whole
     panel) — you may need to restore them if anything goes wrong
   - Find the records pointing at Wix's servers (usually `verify.wix.com` etc.)
   - Replace those records with Cloudflare's (provided by the Pages domain setup
     screen)
4. The Wix site will start returning 404s as soon as DNS propagates. New site
   should appear within an hour
5. **Cancel the Wix subscription** once you've verified the new site works
6. **Verify email still works** — if email was hosted through Wix, you'll need
   to set up new email hosting separately before the cutover

If you've never migrated DNS before, ask a developer to do the cutover with you
on a call. It's not hard, but it's awkward to debug remotely.

## 4 · Formspree forms

Four forms on the site need real Formspree IDs in place of the
`FORMSPREE_*_FORM_ID` placeholders:

| File | Form | Placeholder |
| --- | --- | --- |
| `src/pages/sponsors/index.astro` | Sponsor enquiry | `FORMSPREE_SPONSOR_FORM_ID` |
| `src/pages/membership/index.astro` | Membership signup | `FORMSPREE_MEMBERSHIP_FORM_ID` |
| `src/pages/volunteers/index.astro` | Volunteer signup | `FORMSPREE_VOLUNTEER_FORM_ID` |
| `src/pages/about/index.astro` | General contact | `FORMSPREE_CONTACT_FORM_ID` |

### Steps

1. Sign up at [formspree.io](https://formspree.io/) with `admin@wallaroofc.com.au`
2. Verify the email address (click the link Formspree sends)
3. **Free plan supports 50 submissions/month per form, 1 form total** — that's
   not enough for four forms. Two options:
   - **Use one Formspree form for everything**, route messages with the
     `_subject` header (already configured in each form). Pick one form ID, use
     it on all four pages. Simple.
   - **Upgrade to Gold ($10/month)** — gets you 50 forms each handling 1000
     submissions/month. Recommended for a club this size.
4. Create the forms in the Formspree dashboard. Each form gets an 8-character ID
   like `mvojabcd`. Copy each ID.
5. Find-and-replace in the four files above:
   ```
   FORMSPREE_SPONSOR_FORM_ID       → mvoj1111  (your sponsor form ID)
   FORMSPREE_MEMBERSHIP_FORM_ID    → mvoj2222
   FORMSPREE_VOLUNTEER_FORM_ID     → mvoj3333
   FORMSPREE_CONTACT_FORM_ID       → mvoj4444
   ```
6. Test each form by submitting it once. Verify the email arrives at
   `admin@wallaroofc.com.au`.

Each form is already configured with:
- Honeypot field (`name="_gotcha"`) to block bot submissions
- `_subject` header so emails are clearly labeled in the inbox
- Required-field validation

## 5 · Decap CMS access

Once the site is deployed and `config.yml` points at the GitHub repo, the
admin panel works automatically — no OAuth app to register, Decap uses its own
hosted OAuth proxy at `api.decapcms.org`.

### Granting committee editors access

For each committee member who needs to edit content:

1. They create a free GitHub account if they don't have one
2. **github.com/YOUR_ORG/wallaroofc.com.au/settings/access → Invite a collaborator**
3. They accept the email invite
4. They visit `wallaroofc.com.au/admin/` and click **Login with GitHub**
5. They're in

Refer them to [`EDITING.md`](./EDITING.md) for the rest.

### Local-only editing (developers)

If you ever need to edit content without internet (or against a feature branch):

```bash
# Terminal 1
npx decap-server

# Terminal 2
npm run dev
```

Visit `http://localhost:4321/admin/` — Decap edits your working tree directly.

## 6 · Sponsor prospectus PDF

The `/sponsors/` page links to `/assets/wallaroo-fc-sponsor-prospectus-2026.pdf`,
which doesn't exist yet. Either:

- **Upload the PDF**: drop it at `public/assets/wallaroo-fc-sponsor-prospectus-2026.pdf`
  and commit. The link will start working after the next deploy.
- **Or hide the button** until the PDF is ready: edit `src/pages/sponsors/index.astro`
  and comment out the "Download prospectus (PDF)" `<a>` link.

## 7 · Outstanding content placeholders

Things the developer can't determine without committee input. Each one is a
small edit:

| Where | What | Action |
| --- | --- | --- |
| `/history/` premiership wall | The 22 highlighted years are representative; need verified list from club Historian Michael West | Edit `src/components/PremiershipWall.astro`'s `flagYears` prop default |
| `/juniors/` register button | Best-guess PlayHQ URL `playhq.com/afl/register/wallaroofc` — may not be correct | Confirm with PlayHQ admin, update the href |
| `/about/` clubroom hire | Pricing currently says "email for details" — add real rates once decided | Edit `src/pages/about/index.astro` `#hire` section |
| `/teams/{grade}/` coach photos | Currently text-only — add coach headshots if available | Drop photos in `src/assets/photos/` and reference in `src/lib/grades.ts` |
| `/membership/` tier scheme | See section 0 — needs committee decision | Either keep brief's scheme or replace with live site's |

## 8 · Routine deploys after go-live

Once everything's set up, deploys are automatic:

- **Edit via Decap CMS** → Cloudflare rebuilds → live in ~90 seconds
- **Edit via direct GitHub commit** (developer pushing) → same flow
- **Edit via local development + push** → same flow

No manual deploy step. No FTP. Nothing.

## 9 · Rolling back a bad deploy

If a deploy breaks something:

1. **Cloudflare Pages dashboard → Deployments**
2. Find the last working build
3. Click **... → Rollback to this deployment**
4. The previous version is live within 30 seconds

Or revert the commit in git and push — Cloudflare will rebuild from the new HEAD.

## 10 · Monitoring

The site is static, so monitoring is minimal. Suggested:

- **Uptime**: Cloudflare's free monitoring covers this — alerts on `admin@wallaroofc.com.au` if the site goes down
- **Form submissions**: Formspree dashboard shows submission counts per form
- **Search Console**: Submit `https://wallaroofc.com.au/sitemap-index.xml` at
  [search.google.com/search-console](https://search.google.com/search-console)
  for indexing visibility

## 11 · When something breaks

Triage order:

1. **Site is down** — Cloudflare Pages dashboard → Deployments tab. If the
   latest deployment failed, check the build log. Most common cause: an editor
   saved a malformed YAML file via Decap. Roll back per section 9.
2. **An edit doesn't appear** — wait 2 minutes. Cloudflare's build takes ~90
   seconds. If still missing after 5 minutes, check the build log.
3. **Form submissions stop arriving** — check Formspree dashboard. Most likely
   cause: the monthly free-tier quota was hit. Upgrade to Gold ($10/month).
4. **Decap CMS won't log in** — confirm the user is a collaborator on the
   GitHub repo. If they are, ask them to log out and back in.

For anything beyond this, the codebase is small enough (~40 source files) that
any Astro-familiar developer can debug it in an afternoon.
