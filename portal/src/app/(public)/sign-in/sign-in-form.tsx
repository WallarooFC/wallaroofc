"use client";

import { ArrowRight, Mail } from "lucide-react";
import { useActionState } from "react";

import { cn } from "@/lib/utils";

import { signInWithMagicLink, signInWithMicrosoft, type SignInState } from "./actions";

const initialState: SignInState = {};

export function SignInForm({ emailDomain }: { emailDomain: string }) {
  const [state, formAction, pending] = useActionState(signInWithMagicLink, initialState);

  return (
    <div className="flex flex-col gap-6">
      <form action={signInWithMicrosoft}>
        <button
          type="submit"
          className={cn(
            "text-wfc-white flex w-full items-center justify-center gap-2 rounded-md px-4 py-3.5 text-sm font-semibold tracking-wide transition-all",
            "bg-wfc-red hover:bg-wfc-red-deep hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(200,16,46,0.25)]",
            "focus-visible:outline-wfc-red focus-visible:outline-2 focus-visible:outline-offset-2",
          )}
        >
          <span
            aria-hidden
            className="flex h-5 w-5 items-center justify-center rounded bg-white/15 font-mono text-[11px] font-bold"
          >
            M
          </span>
          Continue with Microsoft 365
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </form>

      <div className="font-headline text-wfc-grey flex items-center gap-3 text-[11px] tracking-[0.18em] uppercase">
        <span className="bg-wfc-line h-px flex-1" />
        or use a one-time link
        <span className="bg-wfc-line h-px flex-1" />
      </div>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <div>
          <label
            htmlFor="email"
            className="font-headline text-wfc-grey mb-1.5 block text-[11px] tracking-[0.12em] uppercase"
          >
            Club email
          </label>
          <div className="border-wfc-line focus-within:border-wfc-blue-deep flex items-center rounded-md border bg-white focus-within:shadow-[0_0_0_3px_rgba(10,31,61,0.08)]">
            <Mail className="text-wfc-grey ml-3 h-4 w-4" aria-hidden />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={`secretary${emailDomain}`}
              className="text-wfc-blue-deep placeholder:text-wfc-grey/60 flex-1 bg-transparent px-3 py-3 text-[13px] outline-none"
            />
          </div>
        </div>

        {state.error ? (
          <p
            role="alert"
            className="border-wfc-status-red/30 bg-wfc-status-red/8 text-wfc-status-red rounded-md border px-3 py-2 text-xs"
          >
            {state.error}
          </p>
        ) : null}

        {state.message ? (
          <p
            role="status"
            className="border-wfc-status-green/30 bg-wfc-status-green/8 text-wfc-status-green rounded-md border px-3 py-2 text-xs"
          >
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className={cn(
            "border-wfc-blue-deep text-wfc-blue-deep flex w-full items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-semibold transition-all",
            "hover:bg-wfc-blue-deep hover:text-wfc-white",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {pending ? "Sending link…" : "Email me a sign-in link"}
        </button>
      </form>
    </div>
  );
}
