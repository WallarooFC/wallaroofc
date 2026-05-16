"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { CheckboxRow } from "@/components/ui/checkbox-row";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  GAME_THRESHOLDS,
  MILESTONE_STATUS_OPTIONS,
  MILESTONE_TYPE_OPTIONS,
} from "@/lib/db/milestone-types";
import { SQUAD_LABELS } from "@/lib/db/squads";
import type { FixturePick, MilestoneDetail, PlayerPick } from "@/lib/db/milestones";
import type { MilestoneType } from "@/lib/db/types";

import {
  createMilestone,
  updateMilestone,
  type MilestoneFormState,
} from "../actions";

const INITIAL: MilestoneFormState = { status: "idle" };

export function MilestoneForm({
  milestone,
  players,
  fixtures,
}: {
  milestone?: MilestoneDetail | null;
  players: PlayerPick[];
  fixtures: FixturePick[];
}) {
  const action = milestone
    ? updateMilestone.bind(null, milestone.id)
    : createMilestone;
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Section title="Who & what">
        <Field label="Player" name="player_id" error={fieldErrors.player_id} fullWidth>
          <Select name="player_id" defaultValue={milestone?.player_id ?? ""}>
            <option value="" disabled>
              Pick a player
            </option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.last_name}, {p.first_name} · {SQUAD_LABELS[p.squad]} · {p.games_played_seniors} snr games
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Milestone type"
          name="milestone_type"
          error={fieldErrors.milestone_type}
        >
          <Select
            name="milestone_type"
            defaultValue={milestone?.milestone_type ?? ""}
          >
            <option value="">—</option>
            {MILESTONE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Target game count"
          name="target_game_count"
          error={fieldErrors.target_game_count}
          hint={`Standard thresholds: ${GAME_THRESHOLDS.map((t) => t.target).join(", ")}`}
        >
          <Input
            name="target_game_count"
            type="number"
            inputMode="numeric"
            min={1}
            max={1000}
            defaultValue={milestone?.target_game_count ?? ""}
          />
        </Field>
      </Section>

      <Section title="When">
        <Field
          label="Projected fixture"
          name="projected_fixture_id"
          error={fieldErrors.projected_fixture_id}
          fullWidth
        >
          <Select
            name="projected_fixture_id"
            defaultValue={milestone?.projected_fixture_id ?? ""}
          >
            <option value="">— TBC —</option>
            {fixtures.map((f) => (
              <option key={f.id} value={f.id}>
                Rd {f.round_number ?? "?"} vs {f.opponent ?? "TBC"} ·{" "}
                {new Date(f.match_date).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                })}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" name="status" error={fieldErrors.status}>
          <Select name="status" defaultValue={milestone?.status ?? "upcoming"}>
            {MILESTONE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section title="Checklist" className="lg:col-span-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:col-span-2">
          <CheckboxRow
            name="jumper_ordered"
            label="Jumper ordered"
            description="With name + number stitched."
            defaultChecked={milestone?.jumper_ordered ?? false}
          />
          <CheckboxRow
            name="presentation_planned"
            label="Presentation planned"
            description="Guard of honour, speeches, framed jumper."
            defaultChecked={milestone?.presentation_planned ?? false}
          />
          <CheckboxRow
            name="media_release_sent"
            label="Media release sent"
            description="Yorke Peninsula Country Times + socials."
            defaultChecked={milestone?.media_release_sent ?? false}
          />
        </div>
      </Section>

      <Section title="Notes" className="lg:col-span-2">
        <Field label="Notes" name="notes" error={fieldErrors.notes} fullWidth>
          <Textarea
            name="notes"
            defaultValue={milestone?.notes ?? ""}
            rows={3}
            placeholder="Anything Thomas or the next secretary should know."
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
          href={(milestone ? `/milestones/${milestone.id}` : "/milestones") as Route}
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
          ) : milestone ? (
            "Save changes"
          ) : (
            "Create milestone"
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

// Silence the unused-import warning for MilestoneType when the form trims down.
export type _MilestoneTypeFallback = MilestoneType;
