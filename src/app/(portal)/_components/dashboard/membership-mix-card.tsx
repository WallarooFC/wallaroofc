import { getMembershipMix } from "@/lib/db/queries";

import { Card, CardHeader } from "./card";

export async function MembershipMixCard() {
  const mix = await getMembershipMix();
  const total = Math.max(mix.total, 1);

  // SVG donut math: r = 15.915 -> circumference ~100.
  let offset = 0;
  const segments = mix.buckets.map((b) => {
    const pct = total > 0 ? (b.count / total) * 100 : 0;
    const segment = { pct, dashoffset: -offset, color: b.cssVar, key: b.key };
    offset += pct;
    return segment;
  });

  return (
    <Card span={5}>
      <CardHeader
        title="Membership Mix · 2026"
        subtitle={
          mix.total > 0
            ? `Live from the member register · ${mix.total} total`
            : "Run pnpm seed to populate the member register"
        }
        action="Open register"
      />

      <div className="flex items-center gap-5">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke="var(--color-wfc-cream)"
              strokeWidth="4"
            />
            {segments.map((seg) => (
              <circle
                key={seg.key}
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke={seg.color}
                strokeWidth="4"
                strokeDasharray={`${seg.pct.toFixed(2)} ${(100 - seg.pct).toFixed(2)}`}
                strokeDashoffset={seg.dashoffset.toFixed(2)}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display text-3xl leading-none text-wfc-blue-deep">
              {mix.total}
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-wfc-grey">
              Total
            </div>
          </div>
        </div>

        <ul className="flex-1 space-y-1.5 text-[12px]">
          {mix.buckets.map((b) => {
            const pct = total > 0 ? ((b.count / total) * 100).toFixed(1) : "0.0";
            return (
              <li key={b.key} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: b.cssVar }}
                />
                <span className="flex-1 truncate text-wfc-charcoal">{b.label}</span>
                <span className="font-mono tabular-nums text-wfc-blue-deep">{b.count}</span>
                <span className="w-12 text-right font-mono text-[11px] text-wfc-grey">
                  {pct}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-dashed border-wfc-line pt-3 text-[11px] text-wfc-grey">
        <span>
          📮 {mix.postal} postal · {mix.email} email
        </span>
        <span
          className={
            mix.unpaid > 0 ? "font-medium text-wfc-red" : "font-medium text-wfc-status-green"
          }
        >
          {mix.unpaid} unpaid
        </span>
      </div>
    </Card>
  );
}
