import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  span,
}: {
  className?: string;
  children: ReactNode;
  span?: 4 | 5 | 6 | 7 | 8 | 12;
}) {
  const spanClass: Record<NonNullable<typeof span>, string> = {
    4: "lg:col-span-4",
    5: "lg:col-span-5",
    6: "lg:col-span-6",
    7: "lg:col-span-7",
    8: "lg:col-span-8",
    12: "lg:col-span-12",
  };
  return (
    <section
      className={cn(
        "relative flex flex-col rounded-lg border border-wfc-line bg-white p-5 shadow-[0_1px_2px_rgba(20,49,92,0.04)]",
        span ? spanClass[span] : null,
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-serif text-lg font-semibold tracking-[-0.01em] text-wfc-blue-deep">
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-[11px] text-wfc-grey">{subtitle}</p> : null}
      </div>
      {action ? (
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-wfc-blue-deep">
          {action}
        </span>
      ) : null}
    </header>
  );
}

export function CardCornerTag({ children }: { children: ReactNode }) {
  return (
    <span className="absolute -top-2 right-5 rounded-sm bg-wfc-red px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-wfc-cream shadow-[0_2px_6px_rgba(168,37,43,0.25)]">
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center rounded-md border border-dashed border-wfc-line bg-wfc-cream/60 px-4 py-8 text-sm text-wfc-grey">
      {children}
    </div>
  );
}
