import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CERT_TYPE_LABEL } from "@/lib/db/cert-types";
import { daysToExpiry, getCompliance } from "@/lib/db/compliance";

import { DeleteComplianceButton } from "./_components/delete-compliance-button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getCompliance(id);
  return {
    title: record
      ? `${CERT_TYPE_LABEL[record.cert_type]} · ${record.member_name ?? ""}`
      : "Compliance record",
  };
}

export default async function ComplianceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getCompliance(id);
  if (!record) notFound();

  const days = daysToExpiry(record.expiry_date);
  const tone =
    days === null
      ? "muted"
      : days < 0
        ? "bad"
        : days <= 30
          ? "warn"
          : "ok";

  const tonePill =
    tone === "ok"
      ? "bg-wfc-status-green/10 text-wfc-status-green"
      : tone === "warn"
        ? "bg-wfc-status-amber/10 text-wfc-status-amber"
        : tone === "bad"
          ? "bg-wfc-status-red/10 text-wfc-status-red"
          : "bg-wfc-grey/15 text-wfc-grey";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/compliance"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
          >
            ← Compliance
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            {CERT_TYPE_LABEL[record.cert_type]}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-wfc-grey">
            {record.member_id && record.member_name ? (
              <Link
                href={`/members/${record.member_id}`}
                className="rounded-full bg-wfc-blue/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-blue-deep hover:bg-wfc-blue/20"
              >
                {record.member_name}
              </Link>
            ) : (
              <span className="rounded-full bg-wfc-grey/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
                Unlinked
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${tonePill}`}
            >
              {days === null
                ? "no expiry"
                : days < 0
                  ? `expired ${Math.abs(days)} day${days === -1 ? "" : "s"} ago`
                  : `expires in ${days} day${days === 1 ? "" : "s"}`}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/compliance/${record.id}/edit`}>
            <Button variant="secondary">
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          </Link>
          <DeleteComplianceButton recordId={record.id}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </DeleteComplianceButton>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DetailCard title="Certificate">
          <Detail label="Type" value={CERT_TYPE_LABEL[record.cert_type]} />
          <Detail label="Number" value={record.cert_number ?? "—"} mono />
          <Detail label="Issued" value={record.issued_date ?? "—"} mono />
          <Detail label="Expires" value={record.expiry_date ?? "—"} mono />
        </DetailCard>
        <DetailCard title="Reminders">
          <Detail
            label="Last reminder sent"
            value={
              record.last_reminder_sent_at
                ? new Date(record.last_reminder_sent_at).toLocaleString("en-AU")
                : "—"
            }
            mono
          />
          <Detail
            label="Email on file"
            value={record.member_email ?? "—"}
            mono
          />
          <Detail
            label="Created"
            value={new Date(record.created_at).toLocaleString("en-AU")}
            mono
          />
          <Detail
            label="Last updated"
            value={new Date(record.updated_at).toLocaleString("en-AU")}
            mono
          />
        </DetailCard>
        {record.notes ? (
          <DetailCard title="Notes" className="lg:col-span-2">
            <p className="whitespace-pre-line text-sm text-wfc-charcoal">{record.notes}</p>
          </DetailCard>
        ) : null}
      </div>
    </div>
  );
}

function DetailCard({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-lg border border-wfc-line bg-white p-5 ${className ?? ""}`}>
      <h2 className="mb-3 font-serif text-base font-semibold text-wfc-blue-deep">{title}</h2>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
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
