import { getPlayHqInbox, type InboxRow } from "@/lib/db/queries";

import { Card, CardCornerTag, CardHeader, EmptyState } from "./card";

const SQUAD_LABELS: Record<string, string> = {
  seniors: "SNR",
  reserves: "RES",
  snr_colts: "SNR Colts",
  jnr_colts: "JNR Colts",
  u11s: "U11s",
  u9s: "U9s",
};

function fmtTimestamp(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function PlayHqInboxCard() {
  const { pending, allocated, squadCounts } = await getPlayHqInbox();

  return (
    <Card span={8}>
      <CardCornerTag>PlayHQ → Jumpers</CardCornerTag>
      <CardHeader
        title="PlayHQ Inbox · Jumper Allocation"
        subtitle="Auto-parses rego emails · suggests numbers · one-tap allocate"
        action="Sync now ↻"
      />

      <div className="mb-4 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[0.12em]">
        <PillBadge label="Awaiting allocation" count={pending.length} active />
        <PillBadge label="SNR Colts" count={squadCounts.snr_colts} />
        <PillBadge label="JNR Colts" count={squadCounts.jnr_colts} />
        <PillBadge label="U11s" count={squadCounts.u11s} />
        <PillBadge label="U9s" count={squadCounts.u9s} />
      </div>

      {pending.length === 0 && allocated.length === 0 ? (
        <EmptyState>PlayHQ inbox is clear — no allocations awaiting action.</EmptyState>
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-wfc-line font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
                <th className="px-2 py-2 font-medium">Player</th>
                <th className="px-2 py-2 font-medium">Squad</th>
                <th className="px-2 py-2 font-medium">Reg&apos;d via PlayHQ</th>
                <th className="px-2 py-2 font-medium">Member #</th>
                <th className="px-2 py-2 font-medium">Suggested jumper</th>
                <th className="px-2 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((row) => (
                <PendingRow key={row.id} row={row} />
              ))}
              {allocated.length > 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="border-b border-t border-wfc-line bg-wfc-cream/60 px-2 py-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-wfc-grey"
                  >
                    — Already allocated this season —
                  </td>
                </tr>
              ) : null}
              {allocated.map((row) => (
                <AllocatedRow key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 rounded-md border-l-[3px] border-wfc-red bg-wfc-cream/60 px-3 py-2 text-[11px] leading-relaxed text-wfc-grey">
        <strong className="font-mono uppercase tracking-[0.1em] text-wfc-blue-deep">
          Replaces manual workflow:
        </strong>{" "}
        PlayHQ email → check spreadsheet → assign → email player → update master list. The
        portal parses the email, suggests a number from position + last-season + availability,
        issues the member number, and emails confirmation in one tap.
      </p>
    </Card>
  );
}

function PillBadge({
  label,
  count,
  active = false,
}: {
  label: string;
  count: number;
  active?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
        active
          ? "border-wfc-red bg-wfc-red/10 text-wfc-red"
          : "border-wfc-line bg-white text-wfc-grey",
      ].join(" ")}
    >
      {label}
      <span className="rounded-full bg-wfc-line/40 px-1.5 py-px font-mono text-[10px] text-wfc-blue-deep">
        {count}
      </span>
    </span>
  );
}

function PendingRow({ row }: { row: InboxRow }) {
  const squadLabel = row.squad ? SQUAD_LABELS[row.squad] ?? row.squad : "—";
  return (
    <tr className="border-b border-wfc-line bg-wfc-red/[0.04]">
      <td className="px-2 py-2">
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wfc-red text-[11px] font-medium text-wfc-cream">
            {row.initials}
          </span>
          {row.playerName}
        </span>
      </td>
      <td className="px-2 py-2">
        <span className="rounded-sm bg-wfc-blue-deep px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-wfc-cream">
          {squadLabel}
        </span>
      </td>
      <td className="px-2 py-2 font-mono text-[11px] text-wfc-grey">
        {fmtTimestamp(row.receivedAt)}
      </td>
      <td className="px-2 py-2 font-mono text-[11px] text-wfc-grey">— auto —</td>
      <td className="px-2 py-2">
        {row.suggestedNumber !== null ? (
          <span className="inline-flex items-center gap-2">
            <span className="rounded-sm bg-wfc-red/15 px-2 py-px font-display text-base leading-none text-wfc-red">
              {row.suggestedNumber}
            </span>
            <span className="text-[10px] text-wfc-grey">{row.suggestedReason}</span>
          </span>
        ) : (
          <span className="text-[11px] text-wfc-grey">no suggestion</span>
        )}
      </td>
      <td className="px-2 py-2">
        <button
          type="button"
          className="rounded-md bg-wfc-red px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-wfc-cream hover:bg-wfc-red-deep"
        >
          Allocate
        </button>
      </td>
    </tr>
  );
}

function AllocatedRow({ row }: { row: InboxRow }) {
  const squadLabel = row.squad ? SQUAD_LABELS[row.squad] ?? row.squad : "—";
  return (
    <tr className="border-b border-wfc-line">
      <td className="px-2 py-2">
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wfc-blue text-[11px] font-medium text-wfc-cream">
            {row.initials}
          </span>
          {row.playerName}
        </span>
      </td>
      <td className="px-2 py-2">
        <span className="rounded-sm bg-wfc-blue-deep px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-wfc-cream">
          {squadLabel}
        </span>
      </td>
      <td className="px-2 py-2 font-mono text-[11px] text-wfc-grey">
        {fmtTimestamp(row.receivedAt)}
      </td>
      <td className="px-2 py-2 font-mono text-[11px] text-wfc-blue-deep">
        {row.memberNumber ?? "—"}
      </td>
      <td className="px-2 py-2 font-display text-base text-wfc-blue-deep">
        {row.jumperNumber ?? "—"}
      </td>
      <td className="px-2 py-2 text-[10px] text-wfc-status-green">● Confirmed</td>
    </tr>
  );
}
