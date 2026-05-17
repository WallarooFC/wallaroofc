"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";

import { togglePublished } from "../../actions";

export function PublishToggle({
  agendaId,
  published,
}: {
  agendaId: string;
  published: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await togglePublished(agendaId, !published);
        });
      }}
      className={
        published
          ? "inline-flex items-center gap-1 rounded-full bg-wfc-status-green/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-status-green hover:bg-wfc-status-green/25"
          : "inline-flex items-center gap-1 rounded-full bg-wfc-grey/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey hover:bg-wfc-grey/25"
      }
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
      {published ? "Published · click to unpublish" : "Draft · click to publish"}
    </button>
  );
}
