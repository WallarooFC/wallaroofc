"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestMagicLink, signInWithMicrosoft, type AuthState } from "@/lib/auth/actions";

const initialState: AuthState = { status: "idle" };

export function SignInForm({ initialError }: { initialError?: string; next?: string }) {
  const [state, formAction, pending] = useActionState(requestMagicLink, initialState);

  const errorMessage = state.status === "error" ? state.message : initialError;
  const successMessage = state.status === "success" ? state.message : null;

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@wallaroofc.com.au"
            defaultValue=""
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sending link…
            </>
          ) : (
            <>
              Email me a sign-in link
              <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </Button>
      </form>

      {errorMessage ? (
        <p role="alert" className="text-sm text-wfc-status-red">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p role="status" className="text-sm text-wfc-status-green">
          {successMessage}
        </p>
      ) : null}

      <div className="flex items-center gap-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-wfc-grey">
        <span className="h-px flex-1 bg-wfc-line" />
        or continue with
        <span className="h-px flex-1 bg-wfc-line" />
      </div>

      <form action={signInWithMicrosoft}>
        <Button type="submit" variant="secondary" size="lg" className="w-full">
          <MicrosoftMark />
          Microsoft 365 · @wallaroofc.com.au
        </Button>
      </form>
    </div>
  );
}

function MicrosoftMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden>
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}
