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
import { SQUAD_SHORT } from "@/lib/db/squads";
import type { FixturePick, GateTakingsDetail } from "@/lib/db/gate";

import {
  createGateTakings,
  updateGateTakings,
  type GateFormState,
} from "../actions";

const INITIAL: GateFormState = { status: "idle" };

export function GateForm({
  entry,
  fixtures,
}: {
  entry?: GateTakingsDetail | null;
  fixtures: FixturePick[];
}) {
  const action = entry ? updateGateTakings.bind(null, entry.id) : createGateTakings;
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Section title="Fixture">
        <Field label="Fixture" name="fixture_id" error={fieldErrors.fixture_id} fullWidth>
          <Select name="fixture_id" defaultValue={entry?.fixture_id ?? ""}>
            <option value="">— Standalone / no fixture —</option>
            {fixtures.map((f) => (
              <option key={f.id} value={f.id}>
                {new Date(f.match_date).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                })}{" "}
                · Rd {f.round_number ?? "?"} vs {f.opponent ?? "TBC"}
                {f.grade ? ` · ${SQUAD_SHORT[f.grade]}` : ""}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section title="Money">
        <Field label="Cash (AUD)" name="cash_amount" error={fieldErrors.cash_amount}>
          <Input
            name="cash_amount"
            type="number"
            inputMode="decimal"
            step="0.50"
            min="0"
            defaultValue={entry?.cash_amount ?? "0"}
          />
        </Field>
        <Field label="EFTPOS (AUD)" name="eftpos_amount" error={fieldErrors.eftpos_amount}>
          <Input
            name="eftpos_amount"
            type="number"
            inputMode="decimal"
            step="0.50"
            min="0"
            defaultValue={entry?.eftpos_amount ?? "0"}
          />
        </Field>
      </Section>

      <Section title="Headcount" className="lg:col-span-2">
        <Field label="Adults" name="adults_count" error={fieldErrors.adults_count}>
          <Input
            name="adults_count"
            type="number"
            inputMode="numeric"
            min="0"
            defaultValue={entry?.adults_count ?? 0}
          />
        </Field>
        <Field label="Concessions" name="concessions_count" error={fieldErrors.concessions_count}>
          <Input
            name="concessions_count"
            type="number"
            inputMode="numeric"
            min="0"
            defaultValue={entry?.concessions_count ?? 0}
          />
        </Field>
        <Field label="Kids" name="kids_count" error={fieldErrors.kids_count}>
          <Input
            name="kids_count"
            type="number"
            inputMode="numeric"
            min="0"
            defaultValue={entry?.kids_count ?? 0}
          />
        </Field>
      </Section>

      <Section title="Notes" className="lg:col-span-2">
        <Field label="Notes" name="notes" error={fieldErrors.notes} fullWidth>
          <Textarea
            name="notes"
            defaultValue={entry?.notes ?? ""}
            rows={3}
            placeholder="Cold day, kids free, banking deposit slip #…"
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
          href={(entry ? `/gate/${entry.id}` : "/gate") as Route}
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
          ) : entry ? (
            "Save changes"
          ) : (
            "Record takings"
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{children}</div>
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
    <div className={fullWidth ? "sm:col-span-3" : undefined}>
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
