import Link from "next/link";
import { notFound } from "next/navigation";

import { MEETING_TYPE_LABEL, getAgenda } from "@/lib/db/agendas";

import { AgendaForm } from "../../_components/agenda-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agenda = await getAgenda(id);
  return { title: agenda ? `Edit · ${MEETING_TYPE_LABEL[agenda.meeting_type]}` : "Edit agenda" };
}

export default async function EditAgendaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agenda = await getAgenda(id);
  if (!agenda) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href={`/agendas/${agenda.id}`}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← {MEETING_TYPE_LABEL[agenda.meeting_type]} · {new Date(agenda.meeting_date).toLocaleDateString("en-AU")}
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          Edit agenda
        </h1>
      </header>
      <AgendaForm agenda={agenda} />
    </div>
  );
}
