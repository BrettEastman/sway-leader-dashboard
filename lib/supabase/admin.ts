import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client using secret key (bypasses RLS)
 * Use this only for admin operations in Server Components that need to bypass RLS.
 *
 * Row Level Security (RLS) is a PostgreSQL/Supabase feature that restricts access to rows based on policies. In Supabase, RLS can block queries even with a valid API key if the policies don't allow access.
In this codebase, we use createAdminClient() (with the service role key) to bypass RLS for server-side queries, since these metrics need to read all relevant data regardless of user context.
The regular client (createClient() or createServerClient()) respects RLS policies, which is useful for user-facing queries where you want policy-based restrictions.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check your .env.local file."
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
