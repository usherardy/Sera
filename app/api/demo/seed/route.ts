import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";
import { addDays, daysBetween, isValidTimeZone, todayIn } from "@/lib/dates";
import {
  SAMPLE_COMMITMENTS,
  SAMPLE_DATE,
  SAMPLE_MOMENTS,
  SAMPLE_RECORDINGS,
  SAMPLE_SUMMARY,
} from "@/lib/sample/sample-day";

/**
 * Load the clearly labeled sample day into the signed-in user's account, moved
 * to their "today". Every row is is_sample = true and shows a Sample badge.
 * Loading again replaces the previous sample day.
 */
export async function POST() {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  const { supabase } = auth;

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", auth.userId).maybeSingle();
  const tz = profile?.timezone && isValidTimeZone(profile.timezone) ? profile.timezone : "Europe/Vilnius";
  const today = todayIn(tz);
  const shiftDays = daysBetween(SAMPLE_DATE, today);
  const shiftIso = (iso: string) => new Date(new Date(iso).getTime() + shiftDays * 86_400_000).toISOString();

  await removeSample(supabase);

  const recId = new Map(SAMPLE_RECORDINGS.map((r) => [r.id, crypto.randomUUID()]));
  const momId = new Map(SAMPLE_MOMENTS.map((m) => [m.id, crypto.randomUUID()]));

  const recordings = SAMPLE_RECORDINGS.map((r) => ({
    id: recId.get(r.id),
    title: r.title,
    kind: r.kind,
    recorded_at: shiftIso(r.recorded_at),
    duration_seconds: r.duration_seconds,
    transcript: r.segments.map((s) => s.text).join(" "),
    summary: r.summary,
    topics: r.topics,
    status: "completed",
    is_sample: true,
  }));
  let res = await supabase.from("recordings").insert(recordings);
  if (res.error) return jsonError(500, `Couldn't add sample recordings: ${res.error.message}`);

  const segments = SAMPLE_RECORDINGS.flatMap((r) =>
    r.segments.map((s) => ({ recording_id: recId.get(r.id), idx: s.idx, start_ms: s.start_ms, end_ms: s.end_ms, text: s.text })),
  );
  const moments = SAMPLE_MOMENTS.map((m) => ({
    id: momId.get(m.id),
    recording_id: recId.get(m.recording_id),
    title: m.title,
    category: m.category,
    summary: m.summary,
    importance_reason: m.importance_reason,
    start_ms: m.start_ms,
    end_ms: m.end_ms,
    evidence_text: m.evidence_text,
    confidence: m.confidence,
    is_sample: true,
  }));
  res = await supabase.from("transcript_segments").insert(segments);
  if (res.error) return jsonError(500, `Couldn't add sample transcripts: ${res.error.message}`);
  res = await supabase.from("moments").insert(moments);
  if (res.error) return jsonError(500, `Couldn't add sample moments: ${res.error.message}`);

  // Fresh sample tasks all start as "Needs review", so the demo begins from scratch.
  const commitments = SAMPLE_COMMITMENTS.map((c) => ({
    recording_id: recId.get(c.recording_id),
    moment_id: c.moment_id ? momId.get(c.moment_id) : null,
    title: c.title,
    description: c.description,
    owner_label: c.owner_label,
    due_date: c.due_date ? addDays(c.due_date, shiftDays) : null,
    due_time: c.due_time,
    due_phrase: c.due_phrase,
    evidence_text: c.evidence_text,
    start_ms: c.start_ms,
    end_ms: c.end_ms,
    confidence: c.confidence,
    approval_status: "pending",
    is_sample: true,
  }));
  res = await supabase.from("commitments").insert(commitments);
  if (res.error) return jsonError(500, `Couldn't add sample tasks: ${res.error.message}`);

  // Don't overwrite a real summary the user already has for today.
  res = await supabase
    .from("daily_summaries")
    .upsert({ ...SAMPLE_SUMMARY, local_date: today, is_sample: true }, { onConflict: "user_id,local_date", ignoreDuplicates: true });
  if (res.error) return jsonError(500, `Couldn't add the sample summary: ${res.error.message}`);

  return Response.json({ ok: true, date: today });
}

/** Remove every sample row from the signed-in user's account. */
export async function DELETE() {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  const error = await removeSample(auth.supabase);
  if (error) return jsonError(500, `Couldn't remove the sample day: ${error}`);
  return Response.json({ ok: true });
}

async function removeSample(supabase: NonNullable<Awaited<ReturnType<typeof getAuthedClient>>>["supabase"]) {
  // Recordings cascade to segments, moments and commitments.
  const a = await supabase.from("recordings").delete().eq("is_sample", true);
  if (a.error) return a.error.message;
  const b = await supabase.from("daily_summaries").delete().eq("is_sample", true);
  return b.error?.message ?? null;
}
