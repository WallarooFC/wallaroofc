import { forwardRef, type LabelHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-wfc-grey",
        className,
      )}
      {...props}
    />
  ),
);
Label.displayName = "Label";
