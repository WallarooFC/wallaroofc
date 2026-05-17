import type { ReactNode } from "react";

import { BrandPanel } from "./_components/brand-panel";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-wfc-cream lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel />
      <main className="relative flex items-center justify-center px-6 py-12 sm:px-12 lg:py-16">
        <div className="absolute inset-x-6 top-6 hidden items-center gap-2 rounded-md border border-wfc-line bg-white/85 px-4 py-2 font-mono text-[11px] text-wfc-grey shadow-[0_1px_2px_rgba(20,49,92,0.06)] lg:flex">
          <span aria-hidden className="text-wfc-status-green">
            ●
          </span>
          <span className="text-wfc-blue-deep">
            portal.wallaroofc.com<span className="text-wfc-grey/80">{"  ·  "}sign in</span>
          </span>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
