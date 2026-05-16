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
import { SQUAD_OPTIONS, YEAR_OPTIONS, isJunior } from "@/lib/db/squads";
import type { PlayerDetail } from "@/lib/db/players";
import type { Squad } from "@/lib/db/types";

import { updatePlayer, type PlayerFormState } from "../actions";

const INITIAL: PlayerFormState = { status: "idle" };

const JUMPER_STATUSES: Array<{ value: string; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "suggested", label: "Suggested" },
  { value: "confirmed", label: "Confirmed" },
  { value: "retired", label: "Retired" },
];

export function PlayerForm({ player }: { player: PlayerDetail }) {
  const [squad, setSquad] = useState<Squad>(player.squad);
  const isJnr = isJunior(squad);
  const action = updatePlayer.bind(null, player.id);
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Section title="Squad">
        <Field label="Squad" name="squad" error={fieldErrors.squad}>
          <Select
            name="squad"
            value={squad}
            onChange={(e) => setSquad(e.target.value as Squad)}
          >
            {SQUAD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Year in grade"
          name="year_in_grade"
          error={fieldErrors.year_in_grade}
          hint={isJnr ? undefined : "Juniors only."}
        >
          <Select
            name="year_in_grade"
            defaultValue={player.year_in_grade ?? ""}
            disabled={!isJnr}
          >
            <option value="">—</option>
            {YEAR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date of birth" name="dob" error={fieldErrors.dob}>
          <Input
            name="dob"
            type="date"
            defaultValue={player.dob ?? ""}
          />
        </Field>
        <Field
          label="Position preference"
          name="position_preference"
          error={fieldErrors.position_preference}
        >
          <Input name="position_preference" defaultValue={player.position_preference ?? ""} />
        </Field>
      </Section>

      <Section title="Jumper">
        <Field label="Jumper number" name="jumper_number" error={fieldErrors.jumper_number}>
          <Input
            name="jumper_number"
            type="number"
            inputMode="numeric"
            min={1}
            max={199}
            defaultValue={player.jumper_number ?? ""}
          />
        </Field>
        <Field label="Jumper status" name="jumper_status" error={fieldErrors.jumper_status}>
          <Select name="jumper_status" defaultValue={player.jumper_status}>
            {JUMPER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Last season's jumper"
          name="last_season_jumper"
          error={fieldErrors.last_season_jumper}
        >
          <Input
            name="last_season_jumper"
            type="number"
            inputMode="numeric"
            min={1}
            max={199}
            defaultValue={player.last_season_jumper ?? ""}
          />
        </Field>
        <CheckboxRow
          name="registered_current_season"
          label="Registered this season"
          description="Mirrors PlayHQ registration status."
          defaultChecked={player.registered_current_season}
        />
      </Section>

      {isJnr ? (
        <Section title="Guardian">
          <Field label="Guardian name" name="guardian_name" error={fieldErrors.guardian_name}>
            <Input name="guardian_name" defaultValue={player.guardian_name ?? ""} />
          </Field>
          <Field label="Guardian phone" name="guardian_phone" error={fieldErrors.guardian_phone}>
            <Input name="guardian_phone" defaultValue={player.guardian_phone ?? ""} />
          </Field>
          <Field
            label="Guardian email"
            name="guardian_email"
            error={fieldErrors.guardian_email}
            fullWidth
          >
            <Input
              name="guardian_email"
              type="email"
              defaultValue={player.guardian_email ?? ""}
            />
          </Field>
        </Section>
      ) : (
        <Section title="Senior career">
          <Field
            label="Total games"
            name="games_played"
            error={fieldErrors.games_played}
            hint="All grades."
          >
            <Input
              name="games_played"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={player.games_played}
            />
          </Field>
          <Field
            label="Senior games"
            name="games_played_seniors"
            error={fieldErrors.games_played_seniors}
            hint="Used by the milestone tracker."
          >
            <Input
              name="games_played_seniors"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={player.games_played_seniors}
            />
          </Field>
        </Section>
      )}

      <Section title="Health & notes" className={isJnr ? undefined : "lg:col-span-2"}>
        <Field label="Health flags" name="health_flags" error={fieldErrors.health_flags} fullWidth>
          <Textarea
            name="health_flags"
            defaultValue={player.health_flags ?? ""}
            rows={3}
            placeholder="ADHD, ASD, asthma, allergies, anything coaches and first-aiders should know."
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
          href={`/players/${player.id}` as Route}
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
          ) : (
            "Save changes"
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
  hint,
  fullWidth,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
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
      ) : hint ? (
        <p className="mt-1 text-[11px] text-wfc-grey">{hint}</p>
      ) : null}
    </div>
  );
}
