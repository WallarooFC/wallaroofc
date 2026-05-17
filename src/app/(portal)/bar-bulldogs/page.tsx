import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getVoucherTotals,
  listVouchers,
  type VoucherListRow,
} from "@/lib/db/vouchers";

export const metadata = { title: "Bar & Bulldogs $" };

function formatAud(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function BulldogsDollarsPage() {
  const [vouchers, totals] = await Promise.all([listVouchers(), getVoucherTotals()]);

  const active = vouchers.filter((v) => !v.redeemed_at);
  const redeemed = vouchers.filter((v) => v.redeemed_at).slice(0, 20);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey">
            Bar & canteen · Bulldogs $ ledger
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            Bulldogs $ vouchers
          </h1>
          <p className="mt-1 text-sm text-wfc-grey">
            Sponsor meal vouchers, milestone gifts, anything that needs to come off the bar
            or canteen tab. Each voucher carries a QR code for one-tap redemption.
          </p>
        </div>
        <Link href="/bar-bulldogs/new">
          <Button size="lg">
            <Plus className="h-4 w-4" aria-hidden />
            Issue voucher
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Issued YTD" value={formatAud(totals.issued)} tone="blue" />
        <Tile label="Redeemed" value={formatAud(totals.redeemed)} tone="green" />
        <Tile label="Outstanding" value={formatAud(totals.outstanding)} tone="amber" />
        <Tile
          label="Vouchers"
          value={`${totals.active} active / ${totals.redeemedCount} done`}
          tone="grey"
        />
      </div>

      <Section title="Active vouchers" count={active.length}>
        {active.length === 0 ? (
          <Empty>No active vouchers. Issue one to start the ledger.</Empty>
        ) : (
          <VoucherTable rows={active} />
        )}
      </Section>

      <Section title="Recent redemptions" count={redeemed.length}>
        {redeemed.length === 0 ? (
          <Empty>No vouchers have been redeemed yet.</Empty>
        ) : (
          <VoucherTable rows={redeemed} />
        )}
      </Section>
    </div>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "green" | "amber" | "grey";
}) {
  const colour =
    tone === "green"
      ? "text-wfc-status-green"
      : tone === "amber"
        ? "text-wfc-red"
        : tone === "blue"
          ? "text-wfc-blue-deep"
          : "text-wfc-grey";
  return (
    <div className="rounded-md border border-wfc-line bg-white p-3 text-center">
      <div className={`font-display text-2xl leading-none ${colour}`}>{value}</div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-wfc-grey">
        {label}
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-wfc-line bg-white">
      <header className="flex items-center justify-between border-b border-wfc-line px-5 py-3">
        <h2 className="font-serif text-base font-semibold text-wfc-blue-deep">{title}</h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
          {count} voucher{count === 1 ? "" : "s"}
        </p>
      </header>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-8 text-center text-sm text-wfc-grey">{children}</p>;
}

function VoucherTable({ rows }: { rows: VoucherListRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="bg-wfc-cream/40 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
            <th className="px-4 py-2 font-medium">Code</th>
            <th className="px-4 py-2 font-medium">Recipient</th>
            <th className="px-4 py-2 font-medium">Reason</th>
            <th className="px-4 py-2 font-medium">Amount</th>
            <th className="px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => {
            const isRedeemed = !!v.redeemed_at;
            return (
              <tr key={v.id} className="border-t border-wfc-line hover:bg-wfc-cream/30">
                <td className="px-4 py-2 font-mono text-[11px]">
                  <Link
                    href={`/bar-bulldogs/${v.id}` as Route}
                    className="text-wfc-blue-deep hover:text-wfc-red"
                  >
                    {v.voucher_code}
                  </Link>
                </td>
                <td className="px-4 py-2 text-wfc-blue-deep">{v.member_name}</td>
                <td className="px-4 py-2 text-xs text-wfc-charcoal">
                  {v.issued_reason ?? "—"}
                </td>
                <td className="px-4 py-2 font-display text-base leading-none text-wfc-blue-deep">
                  {formatAud(Number(v.amount_aud))}
                </td>
                <td className="px-4 py-2">
                  {isRedeemed ? (
                    <span className="rounded-full bg-wfc-status-green/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-wfc-status-green">
                      {v.redeemed_at_point ?? "Redeemed"} ·{" "}
                      {v.redeemed_at
                        ? new Date(v.redeemed_at).toLocaleDateString("en-AU")
                        : ""}
                    </span>
                  ) : (
                    <span className="rounded-full bg-wfc-status-amber/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-wfc-status-amber">
                      Active
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
