import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.PUBLIC_SUPABASE_URL  as string;
const supabaseAnon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY env vars');
}

/** Public client — safe in browser and server public routes */
export const supabase = createClient(supabaseUrl, supabaseAnon);

/** Admin client — server-only. Never import in client-side code. */
export function getAdminClient() {
  const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
