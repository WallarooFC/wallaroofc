import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/env";
import type { Database } from "@/lib/db/types";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
