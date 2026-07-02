# Landing takeover widget — public site integration

The admin portal at `portal.wallaroofc.com` exposes a small JavaScript widget the public site (Astro SSR) loads via one `<script>` tag. Whenever a **landing takeover** has been scheduled from the portal and its start/end window contains "now", the widget shows a centred overlay on the landing page for 10 seconds on every visit.

## Integration (Astro)

Drop this into the layout that renders the landing page — typically `src/layouts/BaseLayout.astro` or the specific landing-page layout:

```astro
---
// existing frontmatter…
---
<html lang="en-AU">
  <head>
    <!-- existing head tags… -->
    <script src="https://portal.wallaroofc.com/widget.js" defer></script>
  </head>
  <body>
    <slot />
  </body>
</html>
```

That's the whole integration. No React import, no build-step changes, no environment variables. `defer` makes sure it loads after the page HTML has parsed; the widget itself starts fetching once `DOMContentLoaded` fires (or immediately if already fired).

## What the widget does

On every landing-page visit:

1. Fetches `GET https://portal.wallaroofc.com/api/public/takeover/current`.
2. Response is either `{ "takeover": null }` (no announcement scheduled → widget exits silently) or the template body for the active takeover.
3. If active, injects a fixed-position, centred modal + dark backdrop, animates in over 500 ms (slide-down + fade), holds for 10 s, animates out over another 500 ms and self-removes.
4. Visitor can dismiss early by clicking the `×` or the backdrop.

## Scheduling a takeover

Committee members do this in the portal at `/takeovers/new`:

- Pick a template of category `landing_takeover`.
- Set start / end datetime in Adelaide time.
- The portal enforces "one active takeover at a time" — overlapping windows are rejected at both the UI and the database level.

## Endpoints exposed

| Path                           | Purpose                                         | Method |
| ------------------------------ | ----------------------------------------------- | ------ |
| `/api/public/takeover/current` | JSON payload for the active takeover, or `null` | `GET`  |
| `/widget.js`                   | The vanilla-JS bundle above                     | `GET`  |

Both are `Access-Control-Allow-Origin: *` and safe to call from any origin — no auth tokens or member PII are ever returned.

## Caching

- `/api/public/takeover/current` responds with `Cache-Control: no-store` (the widget must always see the current window).
- `/widget.js` is cached for 60 s in browsers and 300 s at the edge — long enough to avoid hammering the origin, short enough that a hotfix rolls out quickly. Bump the query string if you need an instant refresh (`widget.js?v=2`).

## Local testing

Portal dev server on port 3000:

```bash
pnpm dev
```

Point any Astro page at `http://localhost:3000/widget.js` for the duration of local testing. Or paste this into the browser console on any page to preview the animation:

```js
var s = document.createElement("script");
s.src = "http://localhost:3000/widget.js";
document.head.appendChild(s);
```
