import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Browser-facing Supabase client. Uses anon key + RLS.
 * Authenticated users get row-level access to their own data.
 */
export function createBrowserClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

/**
 * Server-side Supabase client with service role key.
 * Bypasses RLS — use ONLY in server-side API routes.
 * NEVER expose this client to the frontend.
 */
export function createServiceClient(): SupabaseClient {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
