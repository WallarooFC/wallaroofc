import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "focus-within:border-wfc-blue min-h-[88px] w-full rounded-md border border-wfc-line bg-white px-3 py-2 text-sm text-wfc-blue-deep outline-none transition-colors placeholder:text-wfc-grey/70 focus:border-wfc-blue focus:ring-2 focus:ring-wfc-blue/10",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
