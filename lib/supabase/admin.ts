import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client using secret key (bypasses RLS)
 * Use this only for admin operations in Server Components that need to bypass RLS.
 *
 * For regular queries with RLS, use createClient from lib/supabase/server.ts instead.
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

