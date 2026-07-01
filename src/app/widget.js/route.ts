import { NextResponse } from "next/server";

import { env } from "@/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves /widget.js — a vanilla-JS bundle the public site (Astro) loads via
 * one <script src="…/widget.js" async> tag. The widget:
 *   1. Fetches /api/public/takeover/current on load.
 *   2. If a takeover is active, injects a centred modal + dark backdrop.
 *   3. Animates in (slide + fade, 500ms), holds for 10 000ms, animates out.
 *   4. Fires on every visit — no session-storage guard, per the brief.
 *
 * The response is a JS module served with a stable public URL; the API URL
 * is baked in at request time from NEXT_PUBLIC_PORTAL_URL so the widget
 * doesn't need to know its own host.
 */
export async function GET() {
  const portalUrl = env.NEXT_PUBLIC_PORTAL_URL ?? "https://portal.wallaroofc.com";
  const apiUrl = `${portalUrl.replace(/\/$/, "")}/api/public/takeover/current`;

  const source = String.raw`(function () {
  "use strict";

  var API_URL = ${JSON.stringify(apiUrl)};
  var HOLD_MS = 10000;
  var ANIM_MS = 500;
  var STYLE_ID = "wfc-takeover-styles";
  var ROOT_ID = "wfc-takeover-root";

  function injectStylesOnce() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      "#" + ROOT_ID + " { position: fixed; inset: 0; z-index: 2147483000; display: flex; align-items: center; justify-content: center; pointer-events: none; font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif; }" +
      "#" + ROOT_ID + " .wfc-backdrop { position: absolute; inset: 0; background: rgba(10,31,61,0.62); opacity: 0; transition: opacity " + ANIM_MS + "ms ease-out; pointer-events: auto; }" +
      "#" + ROOT_ID + ".wfc-in .wfc-backdrop { opacity: 1; }" +
      "#" + ROOT_ID + " .wfc-card { position: relative; max-width: 520px; width: calc(100% - 32px); background: #FFFFFF; border-radius: 12px; box-shadow: 0 24px 64px rgba(10,31,61,0.35); overflow: hidden; transform: translateY(-40px) scale(0.96); opacity: 0; transition: transform " + ANIM_MS + "ms cubic-bezier(0.16,1,0.3,1), opacity " + ANIM_MS + "ms ease-out; pointer-events: auto; }" +
      "#" + ROOT_ID + ".wfc-in .wfc-card { transform: translateY(0) scale(1); opacity: 1; }" +
      "#" + ROOT_ID + " .wfc-strip { height: 4px; background: #C8102E; }" +
      "#" + ROOT_ID + " .wfc-close { position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border: none; background: transparent; color: #595D63; font-size: 22px; line-height: 1; cursor: pointer; }" +
      "#" + ROOT_ID + " .wfc-close:hover { color: #0A1F3D; }" +
      "#" + ROOT_ID + " .wfc-body { padding: 32px 32px 28px 32px; text-align: center; color: #15171C; }" +
      "#" + ROOT_ID + " .wfc-heading { font-family: Impact, 'Arial Narrow Bold', sans-serif; font-size: 28px; letter-spacing: 0.02em; text-transform: uppercase; color: #0A1F3D; margin: 0 0 12px 0; line-height: 1.1; }" +
      "#" + ROOT_ID + " .wfc-text { font-size: 15px; line-height: 1.55; margin: 0 auto; max-width: 42ch; }" +
      "#" + ROOT_ID + " .wfc-cta { display: inline-block; margin-top: 22px; background: #C8102E; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; letter-spacing: 0.02em; }" +
      "#" + ROOT_ID + " .wfc-cta:hover { background: #8E0B20; }";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderTakeover(body) {
    if (!body || body.kind !== "takeover") return;

    injectStylesOnce();

    // Nuke any prior overlay from the same session (defensive).
    var prior = document.getElementById(ROOT_ID);
    if (prior) prior.remove();

    var root = document.createElement("div");
    root.id = ROOT_ID;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Wallaroo FC announcement");

    var cta = "";
    if (body.ctaLabel && body.ctaUrl) {
      cta = '<a class="wfc-cta" href="' + escapeHtml(body.ctaUrl) + '" rel="noopener">' +
            escapeHtml(body.ctaLabel) + '</a>';
    }

    root.innerHTML =
      '<div class="wfc-backdrop"></div>' +
      '<div class="wfc-card">' +
        '<div class="wfc-strip"></div>' +
        '<button type="button" class="wfc-close" aria-label="Dismiss">&times;</button>' +
        '<div class="wfc-body">' +
          '<h2 class="wfc-heading">' + escapeHtml(body.heading) + '</h2>' +
          '<p class="wfc-text">' + escapeHtml(body.body) + '</p>' +
          cta +
        '</div>' +
      '</div>';

    document.body.appendChild(root);

    var exitTimer;
    function dismiss() {
      clearTimeout(exitTimer);
      root.classList.remove("wfc-in");
      setTimeout(function () {
        if (root.parentNode) root.parentNode.removeChild(root);
      }, ANIM_MS);
    }

    root.querySelector(".wfc-close").addEventListener("click", dismiss);
    root.querySelector(".wfc-backdrop").addEventListener("click", dismiss);

    // Next frame → apply "in" class so the CSS transition runs.
    requestAnimationFrame(function () {
      root.classList.add("wfc-in");
    });

    exitTimer = setTimeout(dismiss, HOLD_MS + ANIM_MS);
  }

  function boot() {
    fetch(API_URL, { cache: "no-store", credentials: "omit" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (payload) {
        if (!payload || !payload.takeover) return;
        renderTakeover(payload.takeover.template.body);
      })
      .catch(function () { /* silent — the public site keeps working */ });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
`;

  return new NextResponse(source, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
