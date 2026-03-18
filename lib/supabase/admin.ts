import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Admin Supabase client using service role key.
 * Bypasses RLS — use only for admin operations (e.g., creating users).
 * NEVER expose this client to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
