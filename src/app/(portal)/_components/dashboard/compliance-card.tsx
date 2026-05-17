import { getComplianceTiles, type ComplianceTile } from "@/lib/db/queries";

import { Card, CardHeader } from "./card";

function statusFor(tile: ComplianceTile): { label: string; tone: "ok" | "warn" | "bad" } {
  if (tile.total === 0) return { label: "register empty", tone: "bad" };
  if (tile.expired > 0) return { label: `${tile.expired} expired`, tone: "bad" };
  if (tile.expiringSoon > 0) return { label: `${tile.expiringSoon} expiring`, tone: "warn" };
  return { label: "all valid", tone: "ok" };
}

const TONE_CLASSES = {
  ok: "bg-wfc-status-green/10 text-wfc-status-green",
  warn: "bg-wfc-status-amber/10 text-wfc-status-amber",
  bad: "bg-wfc-status-red/10 text-wfc-status-red",
};

export async function ComplianceCard() {
  const tiles = await getComplianceTiles();

  return (
    <Card span={12}>
      <CardHeader
        title="Compliance Snapshot"
        subtitle="Auto-tracked from registers · alerts fire at 60/30/14/7 days before expiry"
        action="Audit log →"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => {
          const status = statusFor(tile);
          const ratio = tile.total > 0 ? tile.valid / tile.total : 0;
          return (
            <div
              key={tile.key}
              className="rounded-md border border-wfc-line bg-wfc-cream/40 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-wfc-blue-deep">{tile.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${TONE_CLASSES[status.tone]}`}
                >
                  {status.label}
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-wfc-line/60">
                <div
                  className={`h-full ${
                    status.tone === "bad"
                      ? "bg-wfc-status-red"
                      : status.tone === "warn"
                        ? "bg-wfc-status-amber"
                        : "bg-wfc-status-green"
                  }`}
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-3xl leading-none text-wfc-blue-deep">
                  {tile.valid}
                </span>
                <span className="text-xs text-wfc-grey">
                  {tile.total > 0 ? `of ${tile.total} valid` : tile.targetCopy}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
