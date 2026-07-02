import { NextResponse } from "next/server";

import { getActiveTakeoverForPublic } from "@/lib/takeovers/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public JSON endpoint the landing-page widget hits every visit. Returns
 * `{ takeover: null }` when nothing is active, or the shape the widget
 * needs to render. CORS-permissive so any origin can call it — the
 * response is safe to expose (no auth data, no member PII).
 */
export async function GET() {
  const takeover = await getActiveTakeoverForPublic().catch(() => null);
  const body = takeover
    ? {
        takeover: {
          id: takeover.id,
          endsAt: takeover.endsAt,
          template: {
            id: takeover.template.id,
            body: takeover.template.body,
          },
        },
      }
    : { takeover: null };

  return NextResponse.json(body, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Max-Age": "600",
    },
  });
}
