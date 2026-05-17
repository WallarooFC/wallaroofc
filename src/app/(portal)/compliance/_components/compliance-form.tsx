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
import { CERT_TYPE_OPTIONS } from "@/lib/db/cert-types";
import type { ComplianceDetail, MemberPick } from "@/lib/db/compliance";

import {
  createCompliance,
  updateCompliance,
  type ComplianceFormState,
} from "../actions";

const INITIAL: ComplianceFormState = { status: "idle" };

export function ComplianceForm({
  record,
  members,
}: {
  record?: ComplianceDetail | null;
  members: MemberPick[];
}) {
  const action = record ? updateCompliance.bind(null, record.id) : createCompliance;
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const isEdit = !!record;

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Section title="Holder">
        <Field label="Member" name="member_id" error={fieldErrors.member_id} fullWidth>
          <Select name="member_id" defaultValue={record?.member_id ?? ""}>
            <option value="">— Unlinked —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.last_name}, {m.first_name}
                {m.member_number ? ` · ${m.member_number}` : ""}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section title="Certification">
        <Field label="Cert type" name="cert_type" error={fieldErrors.cert_type}>
          <Select name="cert_type" defaultValue={record?.cert_type ?? "wwcc"}>
            {CERT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cert number" name="cert_number" error={fieldErrors.cert_number}>
          <Input name="cert_number" defaultValue={record?.cert_number ?? ""} />
        </Field>
        <Field label="Issued" name="issued_date" error={fieldErrors.issued_date}>
          <Input
            name="issued_date"
            type="date"
            defaultValue={record?.issued_date ?? ""}
          />
        </Field>
        <Field label="Expires" name="expiry_date" error={fieldErrors.expiry_date}>
          <Input
            name="expiry_date"
            type="date"
            defaultValue={record?.expiry_date ?? ""}
          />
        </Field>
      </Section>

      <Section title="Notes" className="lg:col-span-2">
        <Field label="Internal notes" name="notes" error={fieldErrors.notes} fullWidth>
          <Textarea
            name="notes"
            defaultValue={record?.notes ?? ""}
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
          href={(record ? `/compliance/${record.id}` : "/compliance") as Route}
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
            "Create record"
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
