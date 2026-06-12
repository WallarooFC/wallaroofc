import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Portal shell — minimal placeholder for commit 2. The real navy sidebar /
 * topbar / architecture strip from the dashboard mockup lands in commit 3.
 *
 * Middleware already gates the (portal) group on authentication; the extra
 * `getUser()` check here defends against a stale cookie surviving the
 * redirect. MFA enrolment gate is wired up in commit 3 once the portal shell
 * and dedicated /mfa route group exist (avoids a self-redirect loop).
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  return <div className="min-h-screen">{children}</div>;
}
