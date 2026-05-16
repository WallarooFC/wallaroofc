import type { Metadata } from "next";

import { MfaVerifyForm } from "./_components/mfa-verify-form";

export const metadata: Metadata = {
  title: "Two-factor",
};

type SearchParams = Promise<{ next?: string }>;

export default async function MfaVerifyPage({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams;

  return (
    <div className="space-y-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-wfc-grey">
        Two-factor · 6-digit code
      </p>
      <h2 className="font-serif text-3xl font-semibold tracking-[-0.02em] text-wfc-blue-deep">
        Verify it&apos;s you.
      </h2>
      <p className="pb-6 text-sm leading-relaxed text-wfc-grey">
        Enter the current code from your authenticator app.
      </p>

      <MfaVerifyForm next={next ?? "/"} />
    </div>
  );
}
