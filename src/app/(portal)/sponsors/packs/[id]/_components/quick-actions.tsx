"use client";

import { CheckCircle2, Loader2, PackageCheck, PackageOpen, Truck } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { SponsorPackStatus } from "@/lib/db/types";

import { advancePackStatus } from "../../actions";

type Action = {
  next: SponsorPackStatus;
  label: string;
  Icon: typeof CheckCircle2;
  hideIfStatusIs?: SponsorPackStatus[];
};

const ACTIONS: Action[] = [
  { next: "built", label: "Mark built", Icon: PackageOpen, hideIfStatusIs: ["built", "delivered"] },
  { next: "scheduled", label: "Schedule delivery", Icon: Truck, hideIfStatusIs: ["delivered"] },
  { next: "delivered", label: "Mark delivered", Icon: CheckCircle2, hideIfStatusIs: ["delivered"] },
  { next: "to_build", label: "Reset", Icon: PackageCheck, hideIfStatusIs: ["to_build"] },
];

export function QuickActions({
  packId,
  status,
}: {
  packId: string;
  status: SponsorPackStatus;
}) {
  const [pending, startTransition] = useTransition();

  const visible = ACTIONS.filter(
    (a) => !a.hideIfStatusIs?.includes(status) && a.next !== status,
  );

  if (visible.length === 0) return null;

  return (
    <section className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-wfc-line bg-wfc-cream/40 px-4 py-3">
      <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.14em] text-wfc-grey">
        Quick actions
      </span>
      {visible.map(({ next, label, Icon }) => (
        <Button
          key={next}
          variant="secondary"
          size="md"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await advancePackStatus(packId, next);
            })
          }
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Icon className="h-4 w-4" aria-hidden />
          )}
          {label}
        </Button>
      ))}
    </section>
  );
}
