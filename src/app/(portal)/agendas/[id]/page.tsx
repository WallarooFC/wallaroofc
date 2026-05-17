import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  MEETING_TYPE_LABEL,
  getAgenda,
} from "@/lib/db/agendas";

import { MarkdownPreview } from "../_components/markdown-preview";
import { ActionItemsManager } from "./_components/action-items-manager";
import { DeleteAgendaButton } from "./_components/delete-agenda-button";
import { PublishToggle } from "./_components/publish-toggle";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agenda = await getAgenda(id);
  return {
    title: agenda
      ? `${MEETING_TYPE_LABEL[agenda.meeting_type]} · ${new Date(agenda.meeting_date).toLocaleDateString(
          "en-AU",
          { day: "numeric", month: "short" },
        )}`
      : "Agenda",
  };
}

export default async function AgendaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agenda = await getAgenda(id);
  if (!agenda) notFound();

  const present = agenda.attendees?.present ?? [];
  const apologies = agenda.attendees?.apologies ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/agendas"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
          >
            ← Agendas
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
            {MEETING_TYPE_LABEL[agenda.meeting_type]} meeting
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-wfc-grey">
            <span className="font-mono text-[11px]">
              {new Date(agenda.meeting_date).toLocaleDateString("en-AU", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <PublishToggle agendaId={agenda.id} published={agenda.published} />
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/agendas/${agenda.id}/edit`}>
            <Button variant="secondary">
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          </Link>
          <DeleteAgendaButton agendaId={agenda.id}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </DeleteAgendaButton>
        </div>
      </header>

      <section className="rounded-lg border border-wfc-line bg-white p-5">
        <h2 className="mb-3 font-serif text-base font-semibold text-wfc-blue-deep">
          Attendance
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Roster label="Present" names={present} emptyCopy="No one recorded yet." />
          <Roster label="Apologies" names={apologies} emptyCopy="No apologies." />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-wfc-line bg-white p-5">
          <h2 className="mb-3 font-serif text-base font-semibold text-wfc-blue-deep">
            Agenda
          </h2>
          <MarkdownPreview source={agenda.agenda_markdown} />
        </section>
        <section className="rounded-lg border border-wfc-line bg-white p-5">
          <h2 className="mb-3 font-serif text-base font-semibold text-wfc-blue-deep">
            Minutes
          </h2>
          <MarkdownPreview source={agenda.minutes_markdown} />
        </section>
      </div>

      <ActionItemsManager agendaId={agenda.id} items={agenda.action_items} />
    </div>
  );
}

function Roster({
  label,
  names,
  emptyCopy,
}: {
  label: string;
  names: string[];
  emptyCopy: string;
}) {
  return (
    <div>
      <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
        {label} · {names.length}
      </h3>
      {names.length === 0 ? (
        <p className="mt-1 text-sm italic text-wfc-grey">{emptyCopy}</p>
      ) : (
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {names.map((name, i) => (
            <li
              key={`${name}-${i}`}
              className="rounded-full bg-wfc-cream px-2 py-0.5 text-[12px] text-wfc-blue-deep"
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
