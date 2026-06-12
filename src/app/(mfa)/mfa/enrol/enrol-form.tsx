"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type EnrolState =
  | { phase: "loading" }
  | { phase: "ready"; factorId: string; qrCode: string; secret: string }
  | { phase: "verifying"; factorId: string; qrCode: string; secret: string }
  | { phase: "verified" }
  | { phase: "error"; message: string };

export function EnrolForm() {
  const router = useRouter();
  const [state, setState] = useState<EnrolState>({ phase: "loading" });
  const [code, setCode] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;
    supabase.auth.mfa.enroll({ factorType: "totp" }).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) {
        setState({
          phase: "error",
          message: error?.message ?? "Could not start enrolment.",
        });
        return;
      }
      setState({
        phase: "ready",
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.phase === "loading") {
    return <p className="text-wfc-grey text-sm">Generating your QR code…</p>;
  }

  if (state.phase === "error") {
    return (
      <p className="border-wfc-status-red/30 bg-wfc-status-red/8 text-wfc-status-red rounded-md border px-3 py-2 text-xs">
        {state.message}
      </p>
    );
  }

  if (state.phase === "verified") {
    return (
      <p className="border-wfc-status-green/30 bg-wfc-status-green/8 text-wfc-status-green rounded-md border px-3 py-2 text-xs">
        Two-factor active. Redirecting…
      </p>
    );
  }

  const { factorId, qrCode, secret } = state;
  const submitting = state.phase === "verifying";

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ phase: "verifying", factorId, qrCode, secret });

    const supabase = createSupabaseBrowserClient();
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error || !challenge.data) {
      setState({
        phase: "error",
        message: challenge.error?.message ?? "Could not challenge factor.",
      });
      return;
    }

    const verify = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code,
    });
    if (verify.error) {
      setState({
        phase: "error",
        message: verify.error.message,
      });
      return;
    }

    setState({ phase: "verified" });
    router.replace("/");
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleVerify} noValidate>
      <div className="border-wfc-line bg-wfc-cream/50 flex flex-col items-center gap-3 rounded-md border p-4">
        <Image
          src={qrCode}
          alt="Authenticator QR code"
          width={180}
          height={180}
          className="rounded bg-white p-2"
          unoptimized
        />
        <div className="text-center">
          <div className="font-headline text-wfc-grey text-[10px] tracking-[0.18em] uppercase">
            Can&apos;t scan?
          </div>
          <code className="text-wfc-blue-deep mt-1 inline-block font-mono text-xs break-all">
            {secret}
          </code>
        </div>
      </div>

      <div>
        <label
          htmlFor="totp-code"
          className="font-headline text-wfc-grey mb-1.5 block text-[11px] tracking-[0.12em] uppercase"
        >
          6-digit code
        </label>
        <input
          id="totp-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          placeholder="123456"
          className="border-wfc-line text-wfc-blue-deep focus:border-wfc-blue-deep w-full rounded-md border bg-white px-3 py-3 text-center font-mono text-lg tracking-[0.3em] outline-none focus:shadow-[0_0_0_3px_rgba(10,31,61,0.08)]"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || code.length !== 6}
        className={cn(
          "bg-wfc-red text-wfc-white w-full rounded-md px-4 py-3 text-sm font-semibold transition-all",
          "hover:bg-wfc-red-deep hover:-translate-y-0.5",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {submitting ? "Verifying…" : "Confirm and continue"}
      </button>
    </form>
  );
}
