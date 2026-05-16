import type { Metadata } from "next";

import { SignInForm } from "./_components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
};

type SearchParams = Promise<{ error?: string; next?: string }>;

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const { error, next } = await searchParams;

  return (
    <div className="space-y-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-wfc-grey">
        Committee access only
      </p>
      <h2 className="font-serif text-3xl font-semibold tracking-[-0.02em] text-wfc-blue-deep">
        Welcome back.
      </h2>
      <p className="pb-6 text-sm leading-relaxed text-wfc-grey">
        Sign in to the Secretary Portal with your club email account.
      </p>

      <SignInForm initialError={error} next={next} />

      <div className="mt-6 rounded-md border-l-[3px] border-wfc-red bg-wfc-blue-deep/[0.04] px-4 py-3 text-[11px] leading-relaxed text-wfc-grey">
        <strong className="font-semibold text-wfc-blue-deep">Two-factor required.</strong> After
        sign-in you&apos;ll be prompted for a 6-digit code from your authenticator app. New
        unrecognised sign-ins alert the Club President by email.
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-wfc-line pt-4 text-[11px] text-wfc-grey">
        <span>Need access? Speak to the Club President.</span>
        <a className="text-wfc-blue-deep hover:underline" href="https://wallaroofc.com.au/privacy">
          Privacy
        </a>
      </div>
    </div>
  );
}
