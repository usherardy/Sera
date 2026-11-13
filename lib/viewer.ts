import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isValidTimeZone, todayIn } from "@/lib/dates";
import { DEFAULT_TZ } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export interface Viewer {
  userId: string;
  displayName: string | null;
  timezone: string;
  /** today's local date (YYYY-MM-DD) in the viewer's timezone */
  today: string;
}

/** The signed-in user and their timezone, or a redirect to /login. */
export async function getViewer(): Promise<Viewer> {
  await connection(); // request-time: reads the clock (Cache Components)
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("display_name,timezone").eq("id", userId).maybeSingle();
  const timezone = profile?.timezone && isValidTimeZone(profile.timezone) ? profile.timezone : DEFAULT_TZ;
  return { userId, displayName: profile?.display_name ?? null, timezone, today: todayIn(timezone) };
}
