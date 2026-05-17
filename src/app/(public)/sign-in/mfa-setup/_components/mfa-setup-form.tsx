"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeMfaEnrolment, type AuthState } from "@/lib/auth/actions";

const initialState: AuthState = { status: "idle" };

export function MfaSetupForm({
  factorId,
  qrSvgDataUrl,
  secret,
}: {
  factorId: string;
  qrSvgDataUrl: string;
  secret: string;
}) {
  const [state, formAction, pending] = useActionState(completeMfaEnrolment, initialState);
  const errorMessage = state.status === "error" ? state.message : null;

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-wfc-line bg-white p-4">
        <div className="flex items-center justify-center">
          <Image
            src={qrSvgDataUrl}
            alt="Authenticator QR code"
            width={180}
            height={180}
            unoptimized
          />
        </div>
        <p className="mt-3 text-center text-[11px] uppercase tracking-[0.18em] text-wfc-grey">
          Can&apos;t scan? Enter this secret:
        </p>
        <p className="mt-1 text-center font-mono text-sm tracking-wide text-wfc-blue-deep">
          {secret}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="factorId" value={factorId} />
        <div>
          <Label htmlFor="code">6-digit code</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
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
            "Activate two-factor"
          )}
        </Button>

        {errorMessage ? (
          <p role="alert" className="text-sm text-wfc-status-red">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </div>
  );
}
