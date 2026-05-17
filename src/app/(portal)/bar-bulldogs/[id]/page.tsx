import { Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";
import { env } from "@/env";
import { getVoucher } from "@/lib/db/vouchers";

import { DeleteVoucherButton } from "./_components/delete-voucher-button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const voucher = await getVoucher(id);
  return { title: voucher ? `Voucher ${voucher.voucher_code}` : "Voucher" };
}

function formatAud(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

export default async function VoucherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const voucher = await getVoucher(id);
  if (!voucher) notFound();

  const redeemUrl = `${env.NEXT_PUBLIC_PORTAL_URL.replace(/\/$/u, "")}/bar-bulldogs/redeem/${voucher.voucher_code}`;
  const qrSvg = await QRCode.toString(redeemUrl, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#0a1f3d", light: "#ffffff" },
    width: 256,
  });
  const qrDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}`;

  const isRedeemed = !!voucher.redeemed_at;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/bar-bulldogs"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
          >
            ← Bulldogs $
          </Link>
          <h1 className="mt-2 font-display text-4xl uppercase tracking-tight text-wfc-blue-deep">
            {voucher.voucher_code}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-wfc-grey">
            <span className="rounded-full bg-wfc-blue/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-blue-deep">
              {voucher.member_name}
            </span>
            <span className="font-display text-2xl leading-none text-wfc-red">
              {formatAud(Number(voucher.amount_aud))}
            </span>
            {isRedeemed ? (
              <span className="rounded-full bg-wfc-status-green/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-status-green">
                Redeemed
              </span>
            ) : (
              <span className="rounded-full bg-wfc-status-amber/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-status-amber">
                Active
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {voucher.member_id ? (
            <Link href={`/members/${voucher.member_id}`}>
              <Button variant="secondary">View member</Button>
            </Link>
          ) : null}
          <DeleteVoucherButton voucherId={voucher.id} code={voucher.voucher_code}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </DeleteVoucherButton>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
        <section className="flex flex-col items-center gap-3 rounded-lg border border-wfc-line bg-white p-5">
          <h2 className="font-serif text-base font-semibold text-wfc-blue-deep">QR code</h2>
          <div className="rounded-md border border-wfc-line bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUri}
              alt={`QR code for voucher ${voucher.voucher_code}`}
              width={224}
              height={224}
            />
          </div>
          <p className="break-all text-center font-mono text-[10px] text-wfc-grey">
            {redeemUrl}
          </p>
        </section>

        <section className="flex flex-col gap-4 rounded-lg border border-wfc-line bg-white p-5">
          <h2 className="font-serif text-base font-semibold text-wfc-blue-deep">
            Voucher details
          </h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Detail label="Amount" value={formatAud(Number(voucher.amount_aud))} />
            <Detail
              label="Issued"
              value={new Date(voucher.issued_at).toLocaleString("en-AU")}
              mono
            />
            <Detail
              label="Reason"
              value={voucher.issued_reason ?? "—"}
              multiline
            />
            {isRedeemed ? (
              <>
                <Detail
                  label="Redeemed at"
                  value={voucher.redeemed_at_point ?? "—"}
                />
                <Detail
                  label="Redeemed on"
                  value={
                    voucher.redeemed_at
                      ? new Date(voucher.redeemed_at).toLocaleString("en-AU")
                      : "—"
                  }
                  mono
                />
                <Detail
                  label="Redeemed amount"
                  value={
                    voucher.redeemed_amount
                      ? formatAud(Number(voucher.redeemed_amount))
                      : "—"
                  }
                />
              </>
            ) : (
              <div className="sm:col-span-2 rounded-md border-l-[3px] border-wfc-red bg-wfc-cream/60 px-4 py-3 text-sm text-wfc-charcoal">
                Scan the QR at the bar or canteen to mark this voucher redeemed in one tap.
                Alternatively, open{" "}
                <Link
                  href={`/bar-bulldogs/redeem/${voucher.voucher_code}`}
                  className="font-medium text-wfc-blue-deep underline"
                >
                  the redemption page
                </Link>{" "}
                directly.
              </div>
            )}
          </dl>
        </section>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
  multiline,
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className={multiline ? "sm:col-span-2" : undefined}>
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">{label}</dt>
      <dd className={mono ? "font-mono text-[12px] text-wfc-blue-deep" : "text-sm text-wfc-charcoal"}>
        {value}
      </dd>
    </div>
  );
}
