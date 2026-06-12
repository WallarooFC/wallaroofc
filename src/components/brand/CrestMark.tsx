import { cn } from "@/lib/utils";

/**
 * Placeholder crest tile. Renders an outlined shield with "WFC" centred.
 * Swap the inner SVG for the actual club crest PNG once
 * /reference/Wallaroo_Football_Club.png lands in the repo.
 */
export function CrestMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-[0_4px_16px_rgba(0,0,0,0.35),0_0_0_2px_var(--color-wfc-red)]",
        className,
      )}
      role="img"
      aria-label="Wallaroo FC crest"
    >
      <svg viewBox="0 0 32 32" className="h-3/4 w-3/4" aria-hidden>
        <path
          d="M16 2 L28 6 V14 C28 22 22 28 16 30 C10 28 4 22 4 14 V6 Z"
          fill="none"
          stroke="var(--color-wfc-blue-deep)"
          strokeWidth="1.5"
        />
        <text
          x="16"
          y="20"
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontSize="9"
          fill="var(--color-wfc-blue-deep)"
          letterSpacing="0.5"
        >
          WFC
        </text>
      </svg>
    </div>
  );
}
