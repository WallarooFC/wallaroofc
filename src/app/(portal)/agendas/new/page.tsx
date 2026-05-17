import Link from "next/link";

import { AgendaForm } from "../_components/agenda-form";

export const metadata = { title: "New agenda" };

export default function NewAgendaPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/agendas"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          ← Agendas
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          New agenda
        </h1>
      </header>
      <AgendaForm />
    </div>
  );
}
