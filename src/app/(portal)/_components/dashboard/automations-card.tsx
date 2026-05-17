import { Bell, Clock, Mail, Receipt, ScrollText, Users } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { Card } from "./card";

type Rule = {
  key: string;
  title: string;
  body: string;
  meta: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  enabled: boolean;
};

const RULES: Rule[] = [
  {
    key: "playhq",
    title: "PlayHQ rego parser",
    body: "Reads PlayHQ email notifications, drops player into pending queue, auto-allocates member number, suggests jumper.",
    meta: "Wires up once Resend inbound webhook is verified · step 7",
    Icon: Mail,
    enabled: false,
  },
  {
    key: "milestones",
    title: "Game milestone tracker",
    body: "Counts senior games from PlayHQ match results · flags 50/100/150/200 four weeks out.",
    meta: "Counts from players.games_played_seniors · step 11",
    Icon: Clock,
    enabled: false,
  },
  {
    key: "expiry",
    title: "WWCC + First Aid expiry watch",
    body: "Auto-email at 60/30/14/7 days before expiry with renewal link.",
    meta: "Daily Vercel cron · step 8",
    Icon: Bell,
    enabled: false,
  },
  {
    key: "roster",
    title: "Roster SMS fill",
    body: "Bar, gate, goal umpires, timekeepers: SMS qualified members in rotation until filled.",
    meta: "Twilio integration · pending SMS_ENABLED=true · step 9",
    Icon: Users,
    enabled: false,
  },
  {
    key: "gate",
    title: "Gate & bar takings",
    body: "Daily reconciliation. Bulldogs $ vouchers auto-marked redeemed on QR scan.",
    meta: "Square integration deferred to v2 · manual entry in step 13",
    Icon: Receipt,
    enabled: false,
  },
  {
    key: "minutes",
    title: "Minutes from template",
    body: "Committee meeting agenda autopopulates from last minutes' action items + open issues.",
    meta: "Coming in step 14",
    Icon: ScrollText,
    enabled: false,
  },
];

export function AutomationsCard() {
  return (
    <Card
      span={4}
      className="border-wfc-blue-deep/60 bg-gradient-to-b from-wfc-blue-deep to-wfc-blue-darkest text-wfc-cream shadow-[0_4px_18px_rgba(10,31,61,0.25)]"
    >
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg font-semibold tracking-[-0.01em] text-wfc-cream">
            Automations Running
          </h2>
          <p className="mt-1 text-[11px] text-wfc-cream/70">
            Background rules saving Thomas hours each week
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-wfc-cream/75">
          + New rule
        </span>
      </header>

      <ul className="flex flex-col gap-3">
        {RULES.map((rule) => (
          <li
            key={rule.key}
            className="flex items-start gap-3 rounded-md bg-wfc-cream/[0.04] p-3"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-wfc-cream/10 text-wfc-cream/90">
              <rule.Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{rule.title}</div>
              <p className="mt-0.5 text-[11px] leading-snug text-wfc-cream/75">{rule.body}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-wfc-cream/55">
                {rule.meta}
              </p>
            </div>
            <span
              aria-hidden
              className={[
                "mt-0.5 h-3 w-7 shrink-0 rounded-full",
                rule.enabled ? "bg-wfc-status-green/80" : "bg-wfc-cream/15",
              ].join(" ")}
            >
              <span
                className={[
                  "block h-3 w-3 rounded-full bg-wfc-cream transition-transform",
                  rule.enabled ? "translate-x-4" : "translate-x-0",
                ].join(" ")}
              />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
