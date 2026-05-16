import Link from "next/link";
import { notFound } from "next/navigation";

import { getMember } from "@/lib/db/members";

import { MemberForm } from "../../_components/member-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getMember(id);
  return {
    title: member ? `Edit · ${member.first_name} ${member.last_name}` : "Edit member",
  };
}

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getMember(id);
  if (!member) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href={`/members/${member.id}`}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← {member.first_name} {member.last_name}
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          Edit member
        </h1>
      </header>

      <MemberForm member={member} />
    </div>
  );
}
