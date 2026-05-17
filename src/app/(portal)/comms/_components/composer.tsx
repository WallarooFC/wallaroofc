"use client";

import { Loader2, Send } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SEGMENT_OPTIONS, type Segment } from "@/lib/db/comms-types";

import { MarkdownPreview } from "../../agendas/_components/markdown-preview";
import { sendMailMerge, type ComposeState } from "../actions";

const INITIAL: ComposeState = { status: "idle" };

export function Composer({
  sizes,
}: {
  sizes: Record<Segment, { total: number; withEmail: number }>;
}) {
  const [state, formAction, pending] = useActionState(sendMailMerge, INITIAL);
  const [segment, setSegment] = useState<Segment>("all_with_email");
  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>(DEFAULT_BODY);

  const segmentSize = sizes[segment];
  const fieldErrors =
    state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <section className="rounded-lg border border-wfc-line bg-white p-5">
        <h3 className="mb-4 font-serif text-base font-semibold text-wfc-blue-deep">
          Recipients
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_220px]">
          <div>
            <Label htmlFor="segment">Segment</Label>
            <Select
              name="segment"
              value={segment}
              onChange={(e) => setSegment(e.target.value as Segment)}
            >
              {SEGMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-[11px] text-wfc-grey">
              {SEGMENT_OPTIONS.find((o) => o.value === segment)?.help}
            </p>
          </div>
          <div className="flex flex-col justify-end rounded-md border border-wfc-line bg-wfc-cream/40 p-3 text-center">
            <div className="font-display text-2xl leading-none text-wfc-blue-deep">
              {segmentSize?.withEmail ?? 0}
              <span className="ml-1 text-base text-wfc-grey">/ {segmentSize?.total ?? 0}</span>
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-wfc-grey">
              Will email · in segment
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-wfc-line bg-white p-5">
        <h3 className="mb-4 font-serif text-base font-semibold text-wfc-blue-deep">
          Message
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. 2026 membership renewal — quick word from Thomas"
              required
            />
            {fieldErrors.subject ? (
              <p role="alert" className="mt-1 text-[11px] text-wfc-status-red">
                {fieldErrors.subject}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div>
              <Label htmlFor="body_markdown">Body · markdown</Label>
              <Textarea
                name="body_markdown"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={16}
              />
              {fieldErrors.body_markdown ? (
                <p role="alert" className="mt-1 text-[11px] text-wfc-status-red">
                  {fieldErrors.body_markdown}
                </p>
              ) : null}
              <p className="mt-1 text-[11px] text-wfc-grey">
                Placeholders:{" "}
                <code className="rounded bg-wfc-cream px-1 font-mono">{"{{first_name}}"}</code>,{" "}
                <code className="rounded bg-wfc-cream px-1 font-mono">{"{{last_name}}"}</code>,{" "}
                <code className="rounded bg-wfc-cream px-1 font-mono">{"{{full_name}}"}</code>
              </p>
            </div>
            <div>
              <Label>Preview (recipient: sample)</Label>
              <div className="min-h-[260px] rounded-md border border-wfc-line bg-wfc-cream/40 p-3">
                <MarkdownPreview
                  source={body.replace(/\{\{\s*first_name\s*\}\}/gu, "Pat")
                    .replace(/\{\{\s*last_name\s*\}\}/gu, "Williams")
                    .replace(/\{\{\s*full_name\s*\}\}/gu, "Pat Williams")}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-wfc-line pt-4">
        {state.status === "error" ? (
          <p role="alert" className="mr-auto text-sm text-wfc-status-red">
            {state.message}
          </p>
        ) : state.status === "sent" ? (
          <p role="status" className="mr-auto text-sm text-wfc-status-green">
            Sent {state.sent} email{state.sent === 1 ? "" : "s"} · skipped {state.skipped}
            {state.failed > 0 ? ` · failed ${state.failed}` : ""}.
          </p>
        ) : null}
        <Button type="submit" disabled={pending} size="lg">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden />
              Send to {segmentSize?.withEmail ?? 0} recipient
              {(segmentSize?.withEmail ?? 0) === 1 ? "" : "s"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

const DEFAULT_BODY = `Hi {{first_name}},

A quick note from the Wallaroo FC committee.



Cheers,
Thomas Depledge
Club Secretary, Wallaroo Football Club`;
