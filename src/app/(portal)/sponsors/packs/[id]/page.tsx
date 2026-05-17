import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  PACK_STATUS_LABEL,
  PACK_STATUS_PILL,
  SPONSOR_TIER_LABEL,
  getSponsorPack,
} from "@/lib/db/sponsors";
import type { SponsorTier } from "@/lib/db/sponsors";

import { DeletePackButton } from "./_components/delete-pack-button";
import { QuickActions } from "./_components/quick-actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pack = await getSponsorPack(id);
  return {
    title: pack ? `${pack.sponsor_name} pack` : "Sponsor pack",
  };
}

export default async function SponsorPackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pack = await getSponsorPack(id);
  if (!pack) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/sponsors/packs"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
          >
            ← Pack tracker
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            {pack.sponsor_name}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-wfc-grey">
            {pack.sponsor_tier ? (
              <span className="rounded-full bg-wfc-blue/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-blue-deep">
                {SPONSOR_TIER_LABEL[pack.sponsor_tier as SponsorTier] ?? pack.sponsor_tier}
              </span>
            ) : null}
            <span className="font-mono text-[11px]">{pack.season} season</span>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${PACK_STATUS_PILL[pack.pack_status]}`}
            >
              {PACK_STATUS_LABEL[pack.pack_status]}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {pack.member_id ? (
            <Link href={`/members/${pack.member_id}`}>
              <Button variant="secondary">View sponsor</Button>
            </Link>
          ) : null}
          <Link href={`/sponsors/packs/${pack.id}/edit`}>
            <Button variant="secondary">
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          </Link>
          <DeletePackButton packId={pack.id} sponsorName={pack.sponsor_name}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </DeletePackButton>
        </div>
      </header>

      <QuickActions packId={pack.id} status={pack.pack_status} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-wfc-line bg-white p-5">
          <h2 className="mb-3 font-serif text-base font-semibold text-wfc-blue-deep">
            Contents
          </h2>
          {pack.contents.length === 0 ? (
            <p className="text-sm text-wfc-grey">No items listed yet.</p>
          ) : (
            <ul className="divide-y divide-wfc-line">
              {pack.contents.map((c, i) => (
                <li key={`${c.item}-${i}`} className="flex items-center justify-between py-2">
                  <span className="text-sm text-wfc-charcoal">{c.item}</span>
                  <span className="font-mono text-xs text-wfc-blue-deep">× {c.qty}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-wfc-line bg-white p-5">
          <h2 className="mb-3 font-serif text-base font-semibold text-wfc-blue-deep">
            Delivery
          </h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Detail
              label="Scheduled"
              value={pack.scheduled_delivery ?? "—"}
              mono
            />
            <Detail
              label="Delivered"
              value={pack.delivered_at ?? "—"}
              mono
            />
            <Detail
              label="Signed receipt"
              value={pack.signed_receipt_path ?? "—"}
              mono
              multiline
            />
            <Detail
              label="Created"
              value={new Date(pack.created_at).toLocaleString("en-AU")}
              mono
            />
            <Detail
              label="Last updated"
              value={new Date(pack.updated_at).toLocaleString("en-AU")}
              mono
            />
          </dl>
        </section>

        {pack.notes ? (
          <section className="rounded-lg border border-wfc-line bg-white p-5 lg:col-span-2">
            <h2 className="mb-3 font-serif text-base font-semibold text-wfc-blue-deep">
              Notes
            </h2>
            <p className="whitespace-pre-line text-sm text-wfc-charcoal">{pack.notes}</p>
          </section>
        ) : null}
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
      <dd
        className={
          mono ? "font-mono text-[12px] text-wfc-blue-deep" : "text-sm text-wfc-charcoal"
        }
      >
        {value}
      </dd>
    </div>
  );
}
