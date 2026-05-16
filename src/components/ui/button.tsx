import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-[0.04em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wfc-red focus-visible:ring-offset-2 focus-visible:ring-offset-wfc-cream disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-wfc-red text-wfc-cream hover:bg-wfc-red-deep hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(168,37,43,0.25)]",
        secondary:
          "border border-wfc-line bg-white text-wfc-blue-deep hover:border-wfc-blue hover:bg-white",
        ghost: "text-wfc-blue-deep hover:bg-wfc-line/30",
      },
      size: {
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-5 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
