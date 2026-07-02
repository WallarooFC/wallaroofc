import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Club crest tile. Sources the PNG extracted from
 * `reference/wallaroofc-letterhead.jpeg` (top-left vignette: shield + bulldog
 * + "EST. 1867" rocker). Sized via the className passed in; default 54px
 * matches the sign-in mockup.
 */
export function CrestMark({ className, size = 54 }: { className?: string; size?: number }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-md bg-white",
        className,
      )}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Wallaroo FC crest"
    >
      <Image
        src="/wallaroo-fc-crest.png"
        alt=""
        width={230}
        height={295}
        priority
        className="h-full w-full object-contain p-1"
      />
    </div>
  );
}
