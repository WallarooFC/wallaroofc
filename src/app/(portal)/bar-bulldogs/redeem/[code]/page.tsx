import Link from "next/link";
import { notFound } from "next/navigation";

import { getVoucherByCode } from "@/lib/db/vouchers";

import { RedeemActions } from "./_components/redeem-actions";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return { title: `Redeem ${code}` };
}

function formatAud(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

export default async function RedeemPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const voucher = await getVoucherByCode(code);
  if (!voucher) notFound();

  const isRedeemed = !!voucher.redeemed_at;
  const amount = Number(voucher.amount_aud);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey">
          Bulldogs $ · Redemption
        </p>
        <h1 className="mt-1 font-display text-4xl uppercase tracking-tight text-wfc-blue-deep">
          {voucher.voucher_code}
        </h1>
      </header>

      <section className="rounded-lg border border-wfc-line bg-white p-5">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Detail label="Recipient" value={voucher.member_name} />
          <Detail label="Amount" value={formatAud(amount)} accent />
          <Detail label="Reason" value={voucher.issued_reason ?? "—"} multiline />
          <Detail
            label="Issued"
            value={new Date(voucher.issued_at).toLocaleDateString("en-AU")}
            mono
          />
        </dl>
      </section>

      {isRedeemed ? (
        <section className="rounded-lg border border-wfc-line bg-wfc-status-green/5 p-5 text-sm">
          <p className="font-serif text-base font-semibold text-wfc-status-green">
            Already redeemed ✓
          </p>
          <p className="mt-1 text-wfc-grey">
            {voucher.redeemed_at_point ? `At the ${voucher.redeemed_at_point}` : "Redeemed"} on{" "}
            {voucher.redeemed_at
              ? new Date(voucher.redeemed_at).toLocaleString("en-AU")
              : ""}
            {voucher.redeemed_amount
              ? ` · ${formatAud(Number(voucher.redeemed_amount))}`
              : ""}
            .
          </p>
        </section>
      ) : (
        <RedeemActions voucherId={voucher.id} amount={amount} />
      )}

      <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
        <Link href="/bar-bulldogs" className="hover:text-wfc-blue-deep">
          ← Back to ledger
        </Link>
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
  multiline,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={multiline ? "col-span-2" : undefined}>
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">{label}</dt>
      <dd
        className={
          accent
            ? "font-display text-2xl leading-none text-wfc-red"
            : mono
              ? "font-mono text-[12px] text-wfc-blue-deep"
              : "text-sm text-wfc-charcoal"
        }
      >
        {value}
      </dd>
    </div>
  );
}
