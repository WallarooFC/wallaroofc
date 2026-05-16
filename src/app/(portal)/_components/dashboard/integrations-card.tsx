import { Card, CardHeader } from "./card";

type Integration = {
  key: string;
  short: string;
  name: string;
  purpose: string;
  status: "connected" | "pending";
  swatch: { bg: string; color: string };
};

const INTEGRATIONS: Integration[] = [
  {
    key: "playhq",
    short: "PA",
    name: "PlayHQ / SANFL",
    purpose: "Player rego sync · clearances · match results",
    status: "pending",
    swatch: { bg: "#e3f1e1", color: "#3d7a3a" },
  },
  {
    key: "stripe",
    short: "SQ",
    name: "Square / Stripe",
    purpose: "Membership subs · sponsor invoices · canteen POS",
    status: "pending",
    swatch: { bg: "#fdf1d8", color: "#c47b1f" },
  },
  {
    key: "resend",
    short: "RE",
    name: "Resend",
    purpose: "Outbound email + inbound PlayHQ webhook",
    status: "pending",
    swatch: { bg: "#dde6f3", color: "#14315c" },
  },
  {
    key: "twilio",
    short: "TW",
    name: "Twilio",
    purpose: "SMS roster fill + reminders (AU number)",
    status: "pending",
    swatch: { bg: "#fadcdc", color: "#a8252b" },
  },
  {
    key: "supabase",
    short: "SB",
    name: "Supabase",
    purpose: "Auth · Postgres + RLS · file storage",
    status: "connected",
    swatch: { bg: "#dceede", color: "#3d7a3a" },
  },
  {
    key: "vercel",
    short: "VC",
    name: "Vercel",
    purpose: "Hosting · cron · preview deploys",
    status: "connected",
    swatch: { bg: "#e8e8e8", color: "#15171c" },
  },
];

export function IntegrationsCard() {
  return (
    <Card span={6}>
      <CardHeader
        title="Integration Stack"
        subtitle="Connected services · single source of truth for the club"
        action="Manage →"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {INTEGRATIONS.map((it) => (
          <div
            key={it.key}
            className="relative rounded-md border border-wfc-line bg-wfc-cream/40 p-3"
          >
            <span
              aria-hidden
              className={[
                "absolute right-3 top-3 h-2 w-2 rounded-full",
                it.status === "connected"
                  ? "bg-wfc-status-green"
                  : "bg-wfc-status-amber animate-pulse",
              ].join(" ")}
            />
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-md font-mono text-xs font-semibold"
                style={{ background: it.swatch.bg, color: it.swatch.color }}
              >
                {it.short}
              </span>
              <div>
                <div className="text-sm font-medium text-wfc-blue-deep">{it.name}</div>
                <p className="mt-0.5 text-[11px] leading-snug text-wfc-grey">{it.purpose}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
