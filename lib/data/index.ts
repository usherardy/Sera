// Data access for server components.
// PHASE 1a: served from the clearly labeled sample day so the design can be reviewed.
// PHASE 1b: these same signatures are backed by Supabase queries under RLS.

import {
  SAMPLE_COMMITMENTS,
  SAMPLE_DATE,
  SAMPLE_MOMENTS,
  SAMPLE_RECORDINGS,
  SAMPLE_SUMMARY,
  SAMPLE_TZ,
} from "@/lib/sample/sample-day";
import { localDateOf } from "@/lib/format";
import type {
  Commitment,
  DayBundle,
  Moment,
  Recording,
  RecordingDetail,
  WithSource,
} from "@/lib/types";

export interface Viewer {
  displayName: string | null;
  timezone: string;
  today: string;
}

export async function getViewer(): Promise<Viewer> {
  return { displayName: null, timezone: SAMPLE_TZ, today: SAMPLE_DATE };
}

function source(recordingId: string): WithSource["recording"] {
  const r = SAMPLE_RECORDINGS.find((x) => x.id === recordingId)!;
  return { id: r.id, title: r.title, recorded_at: r.recorded_at, kind: r.kind };
}

function stripDetail(r: RecordingDetail): Recording {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { segments, audio_url, ...rest } = r;
  return rest;
}

function momentTime(m: Moment & WithSource): number {
  return new Date(m.recording.recorded_at).getTime() + (m.start_ms ?? 0);
}

export async function listMoments(opts: { date?: string } = {}): Promise<(Moment & WithSource)[]> {
  const tz = (await getViewer()).timezone;
  return SAMPLE_MOMENTS.filter((m) => !m.dismissed)
    .map((m) => ({ ...m, recording: source(m.recording_id) }))
    .filter((m) => !opts.date || localDateOf(m.recording.recorded_at, tz) === opts.date)
    .sort((a, b) => momentTime(a) - momentTime(b));
}

export async function listCommitments(): Promise<(Commitment & WithSource)[]> {
  return SAMPLE_COMMITMENTS.filter((c) => c.approval_status !== "dismissed").map((c) => ({
    ...c,
    recording: source(c.recording_id),
  }));
}

export async function listRecordingsByDay(): Promise<{ date: string; recordings: Recording[] }[]> {
  const tz = (await getViewer()).timezone;
  const groups = new Map<string, Recording[]>();
  for (const r of [...SAMPLE_RECORDINGS].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))) {
    const d = localDateOf(r.recorded_at, tz);
    groups.set(d, [...(groups.get(d) ?? []), stripDetail(r)]);
  }
  return [...groups.entries()].map(([date, recordings]) => ({ date, recordings }));
}

export async function getRecording(id: string): Promise<{
  recording: RecordingDetail;
  moments: (Moment & WithSource)[];
  commitments: (Commitment & WithSource)[];
} | null> {
  const recording = SAMPLE_RECORDINGS.find((r) => r.id === id);
  if (!recording) return null;
  const moments = (await listMoments()).filter((m) => m.recording_id === id);
  const commitments = (await listCommitments()).filter((c) => c.recording_id === id);
  return { recording, moments, commitments };
}

export async function getDay(date: string): Promise<DayBundle> {
  const tz = (await getViewer()).timezone;
  const recordings = SAMPLE_RECORDINGS.filter((r) => localDateOf(r.recorded_at, tz) === date)
    .map(stripDetail)
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  const ids = new Set(recordings.map((r) => r.id));
  return {
    date,
    recordings,
    summary: SAMPLE_SUMMARY.local_date === date ? SAMPLE_SUMMARY : null,
    moments: (await listMoments()).filter((m) => ids.has(m.recording_id)),
    commitments: (await listCommitments()).filter((c) => ids.has(c.recording_id)),
  };
}
