import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AUDIO_BUCKET } from "@/lib/supabase/config";
import { dayBoundsUtc, isValidTimeZone, todayIn } from "@/lib/dates";
import { DEFAULT_TZ, localDateOf } from "@/lib/format";
import type {
  Commitment,
  DailySummary,
  DayBundle,
  Moment,
  Recording,
  RecordingDetail,
  TranscriptSegment,
  WithSource,
} from "@/lib/types";
import type { RecordingBundle, Viewer } from "./types";

// Real data, read as the signed-in user. RLS guarantees every query only ever
// sees the viewer's own rows; we never filter by user_id for security.

const RECORDING_COLS =
  "id,title,kind,recorded_at,duration_seconds,status,summary,topics,error_message,is_sample,processing_started_at";
const SOURCE = "recording:recordings(id,title,recorded_at,kind)";
const MOMENT_COLS = `id,recording_id,title,category,summary,importance_reason,start_ms,end_ms,evidence_text,confidence,dismissed,is_sample,${SOURCE}`;
const COMMITMENT_COLS = `id,recording_id,moment_id,title,description,owner_label,due_date,due_time,due_phrase,all_day,evidence_text,start_ms,end_ms,confidence,approval_status,completion_status,external_event_id,is_sample,${SOURCE}`;

/** A recording stuck mid-processing this long is shown as failed so it can be retried. */
const STUCK_AFTER_MS = 5 * 60 * 1000;

type RecordingRow = Recording & { processing_started_at: string | null };

function toRecording(r: RecordingRow): Recording {
  const { processing_started_at, ...rest } = r;
  const busy = rest.status === "transcribing" || rest.status === "analyzing";
  if (busy && processing_started_at && Date.now() - new Date(processing_started_at).getTime() > STUCK_AFTER_MS) {
    return { ...rest, status: "failed", error_message: "Processing took too long. Try again." };
  }
  return { ...rest, topics: rest.topics ?? [] };
}

function bySourceTime(a: Moment & WithSource, b: Moment & WithSource) {
  const t = (m: Moment & WithSource) => new Date(m.recording.recorded_at).getTime() + (m.start_ms ?? 0);
  return t(a) - t(b);
}

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`Couldn't load ${what}: ${error?.message ?? "unknown error"}`);
}

export async function getViewer(): Promise<Viewer> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ?? null;
  if (!userId) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("display_name,timezone").eq("id", userId).maybeSingle();
  const timezone = profile?.timezone && isValidTimeZone(profile.timezone) ? profile.timezone : DEFAULT_TZ;
  return { userId, displayName: profile?.display_name ?? null, timezone, today: todayIn(timezone) };
}

export async function listMoments(opts: { date?: string } = {}): Promise<(Moment & WithSource)[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("moments").select(MOMENT_COLS).eq("dismissed", false).limit(500);
  if (error) fail("moments", error);
  let rows = (data ?? []) as unknown as (Moment & WithSource)[];
  if (opts.date) {
    const tz = (await getViewer()).timezone;
    rows = rows.filter((m) => localDateOf(m.recording.recorded_at, tz) === opts.date);
  }
  return rows.sort(bySourceTime);
}

export async function listCommitments(): Promise<(Commitment & WithSource)[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commitments")
    .select(COMMITMENT_COLS)
    .neq("approval_status", "dismissed")
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) fail("commitments", error);
  return (data ?? []) as unknown as (Commitment & WithSource)[];
}

export async function listRecordingsByDay(): Promise<{ date: string; recordings: Recording[] }[]> {
  const supabase = await createClient();
  const tz = (await getViewer()).timezone;
  const { data, error } = await supabase
    .from("recordings")
    .select(RECORDING_COLS)
    .order("recorded_at", { ascending: false })
    .limit(300);
  if (error) fail("recordings", error);
  const groups = new Map<string, Recording[]>();
  for (const row of (data ?? []) as RecordingRow[]) {
    const r = toRecording(row);
    const d = localDateOf(r.recorded_at, tz);
    groups.set(d, [...(groups.get(d) ?? []), r]);
  }
  return [...groups.entries()].map(([date, recordings]) => ({ date, recordings }));
}

export async function getRecording(id: string): Promise<RecordingBundle | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("recordings")
    .select(`${RECORDING_COLS},storage_path`)
    .eq("id", id)
    .maybeSingle();
  if (error) fail("the recording", error);
  if (!row) return null;

  const [segs, moments, commitments] = await Promise.all([
    supabase.from("transcript_segments").select("id,idx,start_ms,end_ms,text,speaker_label").eq("recording_id", id).order("idx"),
    supabase.from("moments").select(MOMENT_COLS).eq("recording_id", id).eq("dismissed", false),
    supabase.from("commitments").select(COMMITMENT_COLS).eq("recording_id", id).neq("approval_status", "dismissed"),
  ]);
  if (segs.error) fail("the transcript", segs.error);

  const { storage_path, ...rest } = row as RecordingRow & { storage_path: string | null };
  let audio_url: string | null = null;
  if (storage_path) {
    const { data: signed } = await supabase.storage.from(AUDIO_BUCKET).createSignedUrl(storage_path, 60 * 60);
    audio_url = signed?.signedUrl ?? null;
  }

  const recording: RecordingDetail = {
    ...toRecording(rest as RecordingRow),
    segments: (segs.data ?? []) as TranscriptSegment[],
    audio_url,
  };
  return {
    recording,
    moments: ((moments.data ?? []) as unknown as (Moment & WithSource)[]).sort(bySourceTime),
    commitments: (commitments.data ?? []) as unknown as (Commitment & WithSource)[],
  };
}

export async function getDay(date: string): Promise<DayBundle> {
  const supabase = await createClient();
  const tz = (await getViewer()).timezone;
  const { start, end } = dayBoundsUtc(date, tz);
  const { data: recs, error } = await supabase
    .from("recordings")
    .select(RECORDING_COLS)
    .gte("recorded_at", start)
    .lt("recorded_at", end)
    .order("recorded_at", { ascending: true });
  if (error) fail("today's recordings", error);
  const recordings = ((recs ?? []) as RecordingRow[]).map(toRecording);
  const ids = recordings.map((r) => r.id);
  if (ids.length === 0) return { date, recordings, summary: null, moments: [], commitments: [] };

  const [moments, commitments, summary] = await Promise.all([
    supabase.from("moments").select(MOMENT_COLS).in("recording_id", ids).eq("dismissed", false),
    supabase.from("commitments").select(COMMITMENT_COLS).in("recording_id", ids).neq("approval_status", "dismissed").order("created_at"),
    supabase
      .from("daily_summaries")
      .select("local_date,summary,key_topics,key_decisions,notable_info,outstanding")
      .eq("local_date", date)
      .maybeSingle(),
  ]);
  return {
    date,
    recordings,
    summary: (summary.data as DailySummary | null) ?? null,
    moments: ((moments.data ?? []) as unknown as (Moment & WithSource)[]).sort(bySourceTime),
    commitments: (commitments.data ?? []) as unknown as (Commitment & WithSource)[],
  };
}
