"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SQUAD_OPTIONS } from "@/lib/db/squads";
import type { FixtureRow } from "@/lib/db/types";

import {
  createFixture,
  updateFixture,
  type FixtureFormState,
} from "../actions";

const INITIAL: FixtureFormState = { status: "idle" };

export function FixtureForm({ fixture }: { fixture?: FixtureRow | null }) {
  const action = fixture ? updateFixture.bind(null, fixture.id) : createFixture;
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const isEdit = !!fixture;

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Section title="When">
        <Field label="Match date" name="match_date" error={fieldErrors.match_date}>
          <Input
            name="match_date"
            type="date"
            defaultValue={fixture?.match_date ?? ""}
            required
          />
        </Field>
        <Field label="Round" name="round_number" error={fieldErrors.round_number}>
          <Input
            name="round_number"
            type="number"
            inputMode="numeric"
            min={0}
            max={40}
            defaultValue={fixture?.round_number ?? ""}
          />
        </Field>
        <Field label="Grade" name="grade" error={fieldErrors.grade}>
          <Select name="grade" defaultValue={fixture?.grade ?? ""}>
            <option value="">—</option>
            {SQUAD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Home / away" name="home_away" error={fieldErrors.home_away}>
          <Select name="home_away" defaultValue={fixture?.home_away ?? ""}>
            <option value="">—</option>
            <option value="home">Home</option>
            <option value="away">Away</option>
          </Select>
        </Field>
      </Section>

      <Section title="Where & who">
        <Field label="Opponent" name="opponent" error={fieldErrors.opponent} fullWidth>
          <Input name="opponent" defaultValue={fixture?.opponent ?? ""} />
        </Field>
        <Field label="Venue" name="venue" error={fieldErrors.venue} fullWidth>
          <Input name="venue" defaultValue={fixture?.venue ?? ""} />
        </Field>
      </Section>

      <Section title="Notes" className="lg:col-span-2">
        <Field label="Notes" name="notes" error={fieldErrors.notes} fullWidth>
          <Textarea
            name="notes"
            defaultValue={fixture?.notes ?? ""}
            rows={3}
            placeholder="Anything coaches / committee should know on the day."
          />
        </Field>
      </Section>

      <div className="col-span-1 flex items-center justify-end gap-3 border-t border-wfc-line pt-4 lg:col-span-2">
        {state.status === "error" ? (
          <p role="alert" className="mr-auto text-sm text-wfc-status-red">
            {state.message}
          </p>
        ) : null}
        <Link
          href={(fixture ? `/fixtures/${fixture.id}` : "/fixtures") as Route}
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
          ) : isEdit ? (
            "Save changes"
          ) : (
            "Create fixture"
          )}
        </Button>
      </div>
    </form>
  );
}

function Section({
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
