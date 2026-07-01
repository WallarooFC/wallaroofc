"use client";

import { useTransition } from "react";

import { cancelTakeover, pauseTakeover, resumeTakeover } from "@/lib/takeovers/actions";
import type { TakeoverStatus } from "@/lib/takeovers/types";

export function TakeoverRowActions({ id, status }: { id: string; status: TakeoverStatus }) {
  const [pending, start] = useTransition();

  function run(fn: (id: string) => Promise<unknown>) {
    start(async () => {
      await fn(id);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {status === "active" || status === "upcoming" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(pauseTakeover)}
          className="border-wfc-line hover:border-wfc-status-amber text-wfc-charcoal rounded-md border bg-white px-3 py-1.5 disabled:opacity-60"
        >
          Pause
        </button>
      ) : null}
      {status === "paused" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(resumeTakeover)}
          className="border-wfc-status-green text-wfc-status-green rounded-md border bg-white px-3 py-1.5 disabled:opacity-60"
        >
          Resume
        </button>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Cancel this takeover? It'll be removed entirely.")) {
            run(cancelTakeover);
          }
        }}
        className="text-wfc-status-red hover:underline disabled:opacity-60"
      >
        Cancel
      </button>
    </div>
  );
}
