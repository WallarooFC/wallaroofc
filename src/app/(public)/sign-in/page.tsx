import type { Metadata } from "next";
import Link from "next/link";

import { CrestMark } from "@/components/brand/CrestMark";
import { env } from "@/env";

import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
};

function safeHost(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  try {
    return new URL(url).host;
  } catch {
    return fallback;
  }
}

export default function SignInPage() {
  const publicSiteHost = safeHost(env.NEXT_PUBLIC_PUBLIC_SITE_URL, "wallaroofc.com");
  const portalHost = safeHost(env.NEXT_PUBLIC_PORTAL_URL, "portal.wallaroofc.com");
  const emailDomain = `@${publicSiteHost}`;

  return (
    <div className="grid min-h-screen md:grid-cols-[1.1fr_1fr]">
      {/* ===== Left: brand panel ===== */}
      <aside
        className="border-wfc-red text-wfc-cream relative flex flex-col justify-between overflow-hidden border-b-[3px] px-9 py-10 md:border-r-[3px] md:border-b-0 md:px-15 md:py-13"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--color-wfc-blue) 0%, var(--color-wfc-blue-darkest) 60%, #1c2f5a 100%)",
        }}
      >
        {/* Soft red glow on the dark panel; brand red is the sole accent. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 22% 22%, rgba(200,16,46,0.16), transparent 45%), radial-gradient(circle at 88% 84%, rgba(20,49,92,0.45), transparent 55%)",
          }}
        />

        <div className="relative z-10 flex items-center gap-3.5">
          <CrestMark className="h-13 w-13" />
          <div>
            <div className="font-display text-2xl leading-none tracking-[0.1em] uppercase">
              Wallaroo FC
            </div>
            <div className="font-headline text-wfc-cream/75 mt-1 text-[11px] tracking-[0.22em] uppercase">
              Secretary Portal
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="font-headline text-wfc-cream/65 mb-4 text-xs tracking-[0.36em] uppercase">
            Est. 1888 · Yorke Peninsula
          </div>
          <h1 className="mb-4 font-serif text-[44px] leading-[1.05] font-semibold tracking-tight">
            The business of the club,{" "}
            <em className="text-wfc-red font-normal italic">in one place.</em>
          </h1>
          <p className="text-wfc-cream/80 max-w-md font-serif text-[15px] leading-relaxed">
            Members, players, jumpers, milestones, sponsor packs, rosters and minutes — built around
            how the Wallaroo&nbsp;FC Secretary actually works. Sits privately behind the public
            site; working data stays in here.
          </p>
        </div>

        <div className="font-headline text-wfc-cream/55 relative z-10 flex items-end justify-between text-[10px] tracking-[0.15em] uppercase">
          <span>v0.2 prototype</span>
          <span>
            <a href={env.NEXT_PUBLIC_PUBLIC_SITE_URL} className="text-wfc-cream hover:underline">
              ↗ View public site
            </a>{" "}
            · {publicSiteHost}
          </span>
        </div>
      </aside>

      {/* ===== Right: auth panel ===== */}
      <section
        className="relative flex flex-col justify-center px-9 py-13 md:px-15"
        style={{
          backgroundImage:
            "radial-gradient(circle at 88% 12%, rgba(200,16,46,0.06), transparent 35%), repeating-linear-gradient(0deg, transparent 0 39px, rgba(20,49,92,0.03) 39px 40px)",
        }}
      >
        <div className="border-wfc-line font-headline text-wfc-grey absolute top-5 right-9 left-9 flex items-center gap-2.5 rounded-md border bg-white px-3.5 py-2 text-[11px] tracking-wide md:right-15 md:left-15">
          <span className="text-wfc-status-green">🔒</span>
          <span className="text-wfc-blue-deep">
            {portalHost}
            <span className="text-wfc-grey">/sign-in</span>
          </span>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <div className="font-headline text-wfc-grey mb-2 text-[10px] tracking-[0.2em] uppercase">
            Committee access only
          </div>
          <h2 className="text-wfc-blue-deep mb-2 font-serif text-3xl leading-tight font-semibold tracking-tight">
            Welcome back.
          </h2>
          <p className="text-wfc-grey mb-7 text-[13px] leading-relaxed">
            Sign in with your club Microsoft 365 account, or send a one-time link to a whitelisted
            email.
          </p>

          <SignInForm emailDomain={emailDomain} />

          <div className="border-wfc-red bg-wfc-blue-deep/[0.04] text-wfc-grey mt-6 rounded-md border-l-[3px] px-3.5 py-3 text-[11px] leading-relaxed">
            <strong className="text-wfc-blue-deep font-semibold">Two-factor required.</strong> After
            your first sign-in you&apos;ll set up an authenticator app. New sign-ins from
            unrecognised devices alert the Club President by email.
          </div>

          <div className="border-wfc-line text-wfc-grey mt-9 flex items-center justify-between border-t pt-4 text-[11px]">
            <span>Need access? Speak to the Club President.</span>
            <Link href="/privacy" className="text-wfc-blue-deep hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
