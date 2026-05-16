import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  description?: string;
};

export function CheckboxRow({ label, description, className, ...props }: Props) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border border-wfc-line bg-white p-3 text-sm hover:border-wfc-blue/40",
        className,
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-wfc-line text-wfc-red focus:ring-wfc-red"
        {...props}
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-wfc-blue-deep">{label}</span>
        {description ? <span className="text-[11px] text-wfc-grey">{description}</span> : null}
      </span>
    </label>
  );
}
