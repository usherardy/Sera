import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/**
 * Service-role client: bypasses RLS. Server only, and only after an explicit
 * ownership check (background processing, integration_secrets).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!SUPABASE_URL || !key) {
    throw new Error("SUPABASE_SECRET_KEY is not set. Add it to .env.local and to Vercel's environment variables.");
  }
  return createSupabaseClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
