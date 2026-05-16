import type { Metadata } from "next";

import { startMfaEnrolment } from "@/lib/auth/actions";

import { MfaSetupForm } from "./_components/mfa-setup-form";

export const metadata: Metadata = {
  title: "Set up two-factor",
};

export default async function MfaSetupPage() {
  const enrolment = await startMfaEnrolment();

  if (enrolment.status === "error") {
    return (
      <div className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-wfc-grey">
          Step 2 of 2 · Authenticator setup
        </p>
        <h2 className="font-serif text-3xl font-semibold tracking-[-0.02em] text-wfc-blue-deep">
          Couldn&apos;t start enrolment.
        </h2>
        <p className="text-sm text-wfc-status-red">{enrolment.message}</p>
        <a className="text-sm text-wfc-blue-deep underline" href="/sign-in">
          Back to sign-in
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-wfc-grey">
        Step 2 of 2 · Authenticator setup
      </p>
      <h2 className="font-serif text-3xl font-semibold tracking-[-0.02em] text-wfc-blue-deep">
        Add a second factor.
      </h2>
      <p className="pb-6 text-sm leading-relaxed text-wfc-grey">
        Scan the QR with your authenticator app (Google Authenticator, 1Password, Authy), then
        enter the 6-digit code.
      </p>

      <MfaSetupForm
        factorId={enrolment.factorId}
        qrSvgDataUrl={enrolment.qrSvgDataUrl}
        secret={enrolment.secret}
      />
    </div>
  );
}
