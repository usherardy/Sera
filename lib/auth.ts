import "server-only";
import { createClient } from "@/lib/supabase/server";

/** For Route Handlers: the signed-in user's Supabase client (RLS applies), or null. */
export async function getAuthedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return userId ? { supabase, userId } : null;
}

export function jsonError(status: number, error: string) {
  return Response.json({ error }, { status });
}

export const unauthorized = () => jsonError(401, "Sign in required.");
