import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Auth-required but MFA-pending layout. Lives outside (portal) so the future
 * portal-level "force MFA enrolment" redirect can target /mfa/enrol without
 * looping.
 */
export default async function MfaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div
      className="grid min-h-screen place-items-center px-6 py-12"
      style={{
        backgroundImage:
          "radial-gradient(circle at 88% 12%, rgba(200,16,46,0.06), transparent 35%), repeating-linear-gradient(0deg, transparent 0 39px, rgba(20,49,92,0.03) 39px 40px)",
      }}
    >
      {children}
    </div>
  );
}
