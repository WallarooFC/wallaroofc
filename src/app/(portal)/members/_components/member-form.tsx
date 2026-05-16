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
import { MEMBER_TYPE_OPTIONS } from "@/lib/db/member-types";
import type { MemberRow } from "@/lib/db/types";

import {
  createMember,
  updateMember,
  type MemberFormState,
} from "../actions";

const INITIAL: MemberFormState = { status: "idle" };

export function MemberForm({ member }: { member?: MemberRow | null }) {
  const action = member
    ? updateMember.bind(null, member.id)
    : createMember;
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const isEdit = !!member;

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Section title="Identity">
        <Field label="First name" name="first_name" error={fieldErrors.first_name}>
          <Input
            name="first_name"
            defaultValue={member?.first_name ?? ""}
            required
            autoComplete="off"
          />
        </Field>
        <Field label="Last name" name="last_name" error={fieldErrors.last_name}>
          <Input
            name="last_name"
            defaultValue={member?.last_name ?? ""}
            required
            autoComplete="off"
          />
        </Field>
        <Field
          label="Membership number"
          name="member_number"
          error={fieldErrors.member_number}
          hint="Leave blank for sponsors or auto-generation."
        >
          <Input name="member_number" defaultValue={member?.member_number ?? ""} />
        </Field>
        <Field label="Member type" name="member_type" error={fieldErrors.member_type}>
          <Select name="member_type" defaultValue={member?.member_type ?? "senior"}>
            {MEMBER_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section title="Contact">
        <Field label="Email" name="email" error={fieldErrors.email}>
          <Input
            name="email"
            type="email"
            defaultValue={member?.email ?? ""}
            autoComplete="off"
          />
        </Field>
        <Field label="Phone" name="phone" error={fieldErrors.phone}>
          <Input
            name="phone"
            defaultValue={member?.phone ?? ""}
            placeholder="+61… or 04XX XXX XXX"
          />
        </Field>
        <Field
          label="Postal address"
          name="postal_address"
          error={fieldErrors.postal_address}
          fullWidth
        >
          <Textarea
            name="postal_address"
            defaultValue={member?.postal_address ?? ""}
            rows={2}
          />
        </Field>
      </Section>

      <Section title="Membership status">
        <Field label="Joined year" name="joined_year" error={fieldErrors.joined_year}>
          <Input
            name="joined_year"
            type="number"
            inputMode="numeric"
            min={1880}
            max={new Date().getFullYear() + 1}
            defaultValue={member?.joined_year ?? ""}
          />
        </Field>
        <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-3">
          <CheckboxRow
            name="paid_current_season"
            label="Paid current season"
            description="Reflected in the Membership Mix donut."
            defaultChecked={member?.paid_current_season ?? false}
          />
          <CheckboxRow
            name="prefers_email"
            label="Prefers email"
            description="Used by the mail-merge composer."
            defaultChecked={member?.prefers_email ?? true}
          />
          <CheckboxRow
            name="prefers_post"
            label="Prefers post"
            description="For sponsors and life members on paper-only."
            defaultChecked={member?.prefers_post ?? false}
          />
        </div>
      </Section>

      <Section title="Notes">
        <Field label="Internal notes" name="notes" error={fieldErrors.notes} fullWidth>
          <Textarea
            name="notes"
            defaultValue={member?.notes ?? ""}
            rows={3}
            placeholder="Anything Thomas or future committees should know."
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
          href={(member ? `/members/${member.id}` : "/members") as Route}
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
            "Create member"
          )}
        </Button>
      </div>
    </form>
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
