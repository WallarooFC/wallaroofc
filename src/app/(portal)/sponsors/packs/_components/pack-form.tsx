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
import { PACK_STATUS_OPTIONS, SPONSOR_TIER_LABEL } from "@/lib/db/sponsor-types";
import type { SponsorPackDetail, SponsorPick } from "@/lib/db/sponsors";

import {
  createSponsorPack,
  updateSponsorPack,
  type PackFormState,
} from "../actions";

import { ContentsEditor } from "./contents-editor";

const INITIAL: PackFormState = { status: "idle" };

export function PackForm({
  pack,
  sponsors,
  defaultSeason,
}: {
  pack?: SponsorPackDetail | null;
  sponsors: SponsorPick[];
  defaultSeason: number;
}) {
  const action = pack ? updateSponsorPack.bind(null, pack.id) : createSponsorPack;
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Section title="Sponsor">
        <Field label="Sponsor" name="member_id" error={fieldErrors.member_id} fullWidth>
          <Select name="member_id" defaultValue={pack?.member_id ?? ""}>
            <option value="" disabled>
              Pick a sponsor
            </option>
            {sponsors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.last_name}, {s.first_name} · {SPONSOR_TIER_LABEL[s.member_type]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Season" name="season" error={fieldErrors.season}>
          <Input
            name="season"
            type="number"
            inputMode="numeric"
            min={2000}
            max={2100}
            defaultValue={pack?.season ?? defaultSeason}
            required
          />
        </Field>
        <Field label="Status" name="pack_status" error={fieldErrors.pack_status}>
          <Select name="pack_status" defaultValue={pack?.pack_status ?? "to_build"}>
            {PACK_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section title="Delivery">
        <Field
          label="Scheduled delivery"
          name="scheduled_delivery"
          error={fieldErrors.scheduled_delivery}
        >
          <Input
            name="scheduled_delivery"
            type="date"
            defaultValue={pack?.scheduled_delivery ?? ""}
          />
        </Field>
        <Field label="Delivered on" name="delivered_at" error={fieldErrors.delivered_at}>
          <Input
            name="delivered_at"
            type="date"
            defaultValue={pack?.delivered_at ?? ""}
          />
        </Field>
        <Field label="Notes" name="notes" error={fieldErrors.notes} fullWidth>
          <Textarea
            name="notes"
            defaultValue={pack?.notes ?? ""}
            rows={3}
            placeholder="Delivery instructions, signage proof links, follow-ups…"
          />
        </Field>
      </Section>

      <Section title="Contents" className="lg:col-span-2">
        <div className="sm:col-span-2">
          <Label htmlFor="contents">Items in the pack</Label>
          <ContentsEditor initial={pack?.contents ?? []} />
        </div>
      </Section>

      <div className="col-span-1 flex items-center justify-end gap-3 border-t border-wfc-line pt-4 lg:col-span-2">
        {state.status === "error" ? (
          <p role="alert" className="mr-auto text-sm text-wfc-status-red">
            {state.message}
          </p>
        ) : null}
        <Link
          href={(pack ? `/sponsors/packs/${pack.id}` : "/sponsors/packs") as Route}
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
          ) : pack ? (
            "Save changes"
          ) : (
            "Create pack"
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
