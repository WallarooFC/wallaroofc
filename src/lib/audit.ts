import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

/**
 * Append one row to public.activity_log.
 *
 * Activity log mutations are blocked by RLS for every authenticated role
 * (only SELECT is permitted), so this helper goes via the service-role
 * client. Failures are swallowed and logged in dev only -- audit gaps
 * shouldn't cascade into user-facing errors during a mutation.
 */
export async function recordActivity(input: {
  entity_table: string;
  entity_id: string | null;
  action: string;
  diff?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const session = await createSupabaseServerClient();
    const {
      data: { user },
    } = await session.auth.getUser();

    const admin = createSupabaseServiceRoleClient();
    await admin.from("activity_log").insert({
      actor: user?.id ?? null,
      entity_table: input.entity_table,
      entity_id: input.entity_id,
      action: input.action,
      diff: input.diff ?? null,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[audit]", (err as Error).message);
    }
  }
}
