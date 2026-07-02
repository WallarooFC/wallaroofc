"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { scheduleTakeover } from "@/lib/takeovers/actions";
import type { Template } from "@/lib/templates/types";
import { cn } from "@/lib/utils";

/**
 * datetime-local produces "YYYY-MM-DDTHH:mm" in the visitor's *local* time.
 * The scheduler is used in Adelaide; convert those strings to the correct
 * UTC ISO by treating them as Australia/Adelaide wall-clock times.
 */
function adelaideLocalToIso(local: string): string {
  // Parse the local components verbatim; ask JS to build a Date at UTC, then
  // adjust by Adelaide's UTC offset (auto-handles DST via Intl).
  const [datePart, timePart = "00:00"] = local.split("T");
  if (!datePart) return "";
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  if (!year || !month || !day || hour === undefined || minute === undefined) return "";
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const asLocal = new Date(asUtc);
  const offsetMinutes = offsetForAdelaide(asLocal);
  return new Date(asUtc - offsetMinutes * 60_000).toISOString();
}

function offsetForAdelaide(reference: Date): number {
  // Ask Intl what Adelaide's local time looks like for `reference` (interpreted
  // as if it were already Adelaide wall-clock), then compare to UTC to derive
  // the offset. Handles ACST (+9:30) and ACDT (+10:30) transparently.
  const dtf = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Adelaide",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(reference).map((p) => [p.type, p.value]));
  const asAdelaideUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return (asAdelaideUtc - reference.getTime()) / 60_000;
}

export function TakeoverForm({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [startsLocal, setStartsLocal] = useState("");
  const [endsLocal, setEndsLocal] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!templateId) {
      setError("Pick a landing_takeover template first.");
      return;
    }
    if (!startsLocal || !endsLocal) {
      setError("Set both a start and end time.");
      return;
    }
    const startsAt = adelaideLocalToIso(startsLocal);
    const endsAt = adelaideLocalToIso(endsLocal);
    if (!startsAt || !endsAt) {
      setError("Invalid start or end time.");
      return;
    }
    start(async () => {
      const result = await scheduleTakeover({ templateId, startsAt, endsAt });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      router.push("/takeovers");
      router.refresh();
    });
  }

  if (templates.length === 0) {
    return (
      <p className="border-wfc-line text-wfc-grey rounded-lg border border-dashed p-8 text-sm">
        You don&apos;t have any landing-takeover templates yet.{" "}
        <Link href="/templates/new" className="text-wfc-red underline">
          Create one first
        </Link>
        .
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="font-headline text-wfc-grey text-[11px] tracking-[0.12em] uppercase">
          Template
        </span>
        <select
          required
          value={templateId}
          onChange={(event) => setTemplateId(event.target.value)}
          className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.title}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-headline text-wfc-grey text-[11px] tracking-[0.12em] uppercase">
            Starts (Adelaide)
          </span>
          <input
            type="datetime-local"
            required
            value={startsLocal}
            onChange={(event) => setStartsLocal(event.target.value)}
            className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-headline text-wfc-grey text-[11px] tracking-[0.12em] uppercase">
            Ends (Adelaide)
          </span>
          <input
            type="datetime-local"
            required
            value={endsLocal}
            onChange={(event) => setEndsLocal(event.target.value)}
            className="border-wfc-line focus:border-wfc-blue-deep rounded-md border bg-white px-3 py-2.5 text-sm outline-none"
          />
        </label>
      </div>

      {error ? (
        <p
          role="alert"
          className="border-wfc-status-red/30 bg-wfc-status-red/8 text-wfc-status-red rounded-md border px-3 py-2 text-xs"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "bg-wfc-red rounded-md px-5 py-2.5 text-sm font-semibold text-white transition",
            "hover:bg-wfc-red-deep disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {pending ? "Scheduling…" : "Schedule takeover"}
        </button>
        <Link href="/takeovers" className="text-wfc-grey hover:text-wfc-blue-deep px-3 text-sm">
          Cancel
        </Link>
      </div>
    </form>
  );
}
