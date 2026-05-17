"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { CheckboxRow } from "@/components/ui/checkbox-row";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MEETING_TYPE_OPTIONS } from "@/lib/db/agenda-types";
import type { AgendaDetail } from "@/lib/db/agendas";

import { MarkdownPreview } from "./markdown-preview";

import { createAgenda, updateAgenda, type AgendaFormState } from "../actions";

const INITIAL: AgendaFormState = { status: "idle" };

export function AgendaForm({ agenda }: { agenda?: AgendaDetail | null }) {
  const action = agenda ? updateAgenda.bind(null, agenda.id) : createAgenda;
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  const [agendaSrc, setAgendaSrc] = useState(agenda?.agenda_markdown ?? "");
  const [minutesSrc, setMinutesSrc] = useState(agenda?.minutes_markdown ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Section title="Meeting">
        <Field label="Date" name="meeting_date" error={fieldErrors.meeting_date}>
          <Input
            name="meeting_date"
            type="date"
            defaultValue={agenda?.meeting_date ?? ""}
            required
          />
        </Field>
        <Field label="Type" name="meeting_type" error={fieldErrors.meeting_type}>
          <Select name="meeting_type" defaultValue={agenda?.meeting_type ?? "committee"}>
            {MEETING_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
        <CheckboxRow
          name="published"
          label="Published to committee"
          description="Hide until ticked while drafting."
          defaultChecked={agenda?.published ?? false}
        />
      </Section>

      <Section title="Attendees">
        <Field label="Present" name="attendees_present" error={fieldErrors["attendees.present"]} fullWidth>
          <Textarea
            name="attendees_present"
            rows={2}
            defaultValue={(agenda?.attendees?.present ?? []).join(", ")}
            placeholder="Comma- or newline-separated."
          />
        </Field>
        <Field label="Apologies" name="attendees_apologies" error={fieldErrors["attendees.apologies"]} fullWidth>
          <Textarea
            name="attendees_apologies"
            rows={2}
            defaultValue={(agenda?.attendees?.apologies ?? []).join(", ")}
            placeholder="Comma- or newline-separated."
          />
        </Field>
      </Section>

      <MarkdownPair
        name="agenda_markdown"
        label="Agenda"
        value={agendaSrc}
        onChange={setAgendaSrc}
        error={fieldErrors.agenda_markdown}
      />

      <MarkdownPair
        name="minutes_markdown"
        label="Minutes"
        value={minutesSrc}
        onChange={setMinutesSrc}
        error={fieldErrors.minutes_markdown}
      />

      <div className="flex items-center justify-end gap-3 border-t border-wfc-line pt-4">
        {state.status === "error" ? (
          <p role="alert" className="mr-auto text-sm text-wfc-status-red">
            {state.message}
          </p>
        ) : null}
        <Link
          href={(agenda ? `/agendas/${agenda.id}` : "/agendas") as Route}
          className="font-mono text-xs uppercase tracking-[0.16em] text-wfc-grey hover:text-wfc-blue-deep"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending} size="lg">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : agenda ? (
            "Save changes"
          ) : (
            "Create agenda"
          )}
        </Button>
      </div>
    </form>
  );
}

function MarkdownPair({
  name,
  label,
  value,
  onChange,
  error,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <section className="rounded-lg border border-wfc-line bg-white p-5">
      <h3 className="mb-4 font-serif text-base font-semibold text-wfc-blue-deep">{label}</h3>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <Label htmlFor={name}>Markdown</Label>
          <Textarea
            name={name}
            rows={14}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`# ${label}\n\n- item one\n- item two`}
          />
          {error ? (
            <p role="alert" className="mt-1 text-[11px] text-wfc-status-red">
              {error}
            </p>
          ) : null}
        </div>
        <div>
          <Label>Preview</Label>
          <div className="min-h-[260px] rounded-md border border-wfc-line bg-wfc-cream/40 p-3">
            <MarkdownPreview source={value} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-wfc-line bg-white p-5">
      <h3 className="mb-4 font-serif text-base font-semibold text-wfc-blue-deep">{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  error,
  fullWidth,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : undefined}>
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-[11px] text-wfc-status-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}
