import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";
import { AUDIO_BUCKET } from "@/lib/supabase/config";
import { dayBoundsUtc } from "@/lib/dates";
import { localDateOf } from "@/lib/format";

/**
 * Delete a recording and everything derived from it: the audio file, transcript,
 * moments and tasks (database cascade). If it was the day's last recording, the
 * day's summary goes too. Events already in Google Calendar are left alone.
 */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/recordings/[id]">) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  const { supabase } = auth;
  const { id } = await ctx.params;

  const { data: rec, error } = await supabase.from("recordings").select("id,storage_path,recorded_at").eq("id", id).maybeSingle();
  if (error) return jsonError(500, "Couldn't delete the recording.");
  if (!rec) return jsonError(404, "Not found.");

  if (rec.storage_path) {
    const { error: storageError } = await supabase.storage.from(AUDIO_BUCKET).remove([rec.storage_path]);
    if (storageError) return jsonError(500, "Couldn't delete the audio file. Nothing was removed.");
  }
  const { error: delError } = await supabase.from("recordings").delete().eq("id", id);
  if (delError) return jsonError(500, "Couldn't delete the recording.");

  // Drop the day's summary if no recordings remain that day.
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", auth.userId).maybeSingle();
  const tz = profile?.timezone ?? "Europe/Vilnius";
  const day = localDateOf(rec.recorded_at, tz);
  const { start, end } = dayBoundsUtc(day, tz);
  const { count } = await supabase
    .from("recordings")
    .select("id", { count: "exact", head: true })
    .gte("recorded_at", start)
    .lt("recorded_at", end);
  if (!count) await supabase.from("daily_summaries").delete().eq("local_date", day);

  return Response.json({ ok: true });
}
