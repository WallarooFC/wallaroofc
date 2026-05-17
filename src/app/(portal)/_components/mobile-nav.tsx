"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

export function MobileNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-wfc-line bg-white text-wfc-blue-deep lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-30 flex lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-wfc-blue-darkest/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-40 flex h-full w-[260px] max-w-full flex-col bg-wfc-blue-deep text-wfc-cream shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-md text-wfc-cream/80 hover:bg-wfc-cream/10"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
