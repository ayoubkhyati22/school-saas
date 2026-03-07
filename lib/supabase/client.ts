import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Uses cookie-based storage so the middleware can read the session server-side.
// Do NOT use createClient() here — it uses localStorage which the middleware cannot see.
export const supabase = createClientComponentClient();

export function getSupabaseClient() {
  return createClientComponentClient();
}
