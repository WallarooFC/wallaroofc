"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[portal/error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 py-16 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-wfc-grey">
        Something went sideways
      </p>
      <h1 className="font-serif text-3xl font-semibold text-wfc-blue-deep">
        That didn&apos;t go as planned.
      </h1>
      <p className="text-sm text-wfc-grey">
        The page errored out. Try again — and if it persists, the audit log + browser console
        usually point at the culprit.
      </p>
      {error.digest ? (
        <p className="font-mono text-[10px] text-wfc-grey/70">digest: {error.digest}</p>
      ) : null}
      <div className="flex justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button
          variant="secondary"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
