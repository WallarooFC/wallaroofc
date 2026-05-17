import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { MEMBER_TYPE_OPTIONS } from "@/lib/db/member-types";
import { getMember } from "@/lib/db/members";

import { DeleteMemberButton } from "./_components/delete-member-button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getMember(id);
  return {
    title: member ? `${member.first_name} ${member.last_name}` : "Member",
  };
}

const TYPE_LABEL = Object.fromEntries(
  MEMBER_TYPE_OPTIONS.map(({ value, label }) => [value, label]),
);

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getMember(id);
  if (!member) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/members"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
          >
            ← Members
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            {member.first_name} {member.last_name}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-wfc-grey">
            <span className="rounded-full bg-wfc-blue/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-blue-deep">
              {TYPE_LABEL[member.member_type] ?? member.member_type}
            </span>
            {member.member_number ? (
              <span className="font-mono text-[11px]">
                Member #{member.member_number}
              </span>
            ) : null}
            <span
              className={
                member.paid_current_season
                  ? "rounded-full bg-wfc-status-green/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-status-green"
                  : "rounded-full bg-wfc-status-red/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-status-red"
              }
            >
              {member.paid_current_season ? "Paid 2026" : "Unpaid"}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/members/${member.id}/edit`}>
            <Button variant="secondary">
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          </Link>
          <DeleteMemberButton memberId={member.id} memberName={`${member.first_name} ${member.last_name}`}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </DeleteMemberButton>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DetailCard title="Contact">
          <Detail label="Email" value={member.email ?? "—"} mono />
          <Detail label="Phone" value={member.phone ?? "—"} mono />
          <Detail label="Postal address" value={member.postal_address ?? "—"} multiline />
          <Detail
            label="Preferred channel"
            value={
              member.prefers_email
                ? member.prefers_post
                  ? "Email + post"
                  : "Email"
                : member.prefers_post
                  ? "Post"
                  : "Not set"
            }
          />
        </DetailCard>

        <DetailCard title="Membership">
          <Detail label="Joined year" value={member.joined_year ? String(member.joined_year) : "—"} mono />
          <Detail label="PlayHQ participant ID" value={member.playhq_participant_id ?? "—"} mono />
          <Detail
            label="Created"
            value={new Date(member.created_at).toLocaleString("en-AU")}
            mono
          />
          <Detail
            label="Last updated"
            value={new Date(member.updated_at).toLocaleString("en-AU")}
            mono
          />
        </DetailCard>

        {member.notes ? (
          <DetailCard title="Notes" className="lg:col-span-2">
            <p className="whitespace-pre-line text-sm text-wfc-charcoal">{member.notes}</p>
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
    <section
      className={`rounded-lg border border-wfc-line bg-white p-5 ${className ?? ""}`}
    >
      <h2 className="mb-3 font-serif text-base font-semibold text-wfc-blue-deep">{title}</h2>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</dl>
    </section>
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
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
        {label}
      </dt>
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
