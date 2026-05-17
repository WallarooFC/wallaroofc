import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, suffix, ...props }, ref) => {
    const inputEl = (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full flex-1 bg-transparent px-3 text-sm text-wfc-blue-deep outline-none placeholder:text-wfc-grey/70",
          className,
        )}
        {...props}
      />
    );

    if (!suffix) {
      return (
        <div className="focus-within:border-wfc-blue focus-within:ring-3 flex items-center rounded-md border border-wfc-line bg-white transition-colors focus-within:ring-wfc-blue/10">
          {inputEl}
        </div>
      );
    }

    return (
      <div className="focus-within:border-wfc-blue focus-within:ring-3 flex items-center rounded-md border border-wfc-line bg-white transition-colors focus-within:ring-wfc-blue/10">
        {inputEl}
        <span className="font-mono flex h-11 items-center border-l border-wfc-line px-3 text-xs text-wfc-grey">
          {suffix}
        </span>
      </div>
    );
  },
);
Input.displayName = "Input";
