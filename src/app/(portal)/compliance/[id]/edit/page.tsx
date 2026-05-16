import Link from "next/link";
import { notFound } from "next/navigation";

import { CERT_TYPE_LABEL } from "@/lib/db/cert-types";
import { getCompliance, listMembersForPicker } from "@/lib/db/compliance";

import { ComplianceForm } from "../../_components/compliance-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getCompliance(id);
  return {
    title: record ? `Edit · ${CERT_TYPE_LABEL[record.cert_type]}` : "Edit record",
  };
}

export default async function EditCompliancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [record, members] = await Promise.all([
    getCompliance(id),
    listMembersForPicker(),
  ]);
  if (!record) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href={`/compliance/${record.id}`}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← {CERT_TYPE_LABEL[record.cert_type]}
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          Edit compliance record
        </h1>
      </header>

      <ComplianceForm record={record} members={members} />
    </div>
  );
}
