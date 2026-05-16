"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyMfaCode, type AuthState } from "@/lib/auth/actions";

const initialState: AuthState = { status: "idle" };

export function MfaVerifyForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(verifyMfaCode, initialState);
  const errorMessage = state.status === "error" ? state.message : null;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <Label htmlFor="code">6-digit code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          autoComplete="one-time-code"
          autoFocus
          required
          placeholder="123456"
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Verifying…
          </>
        ) : (
          "Continue"
        )}
      </Button>

      {errorMessage ? (
        <p role="alert" className="text-sm text-wfc-status-red">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
