import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth/session";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return <div className="min-h-screen">{children}</div>;
}
