"use client";

import { DESIGN_PREVIEW } from "@/lib/preview";
import type { RecordingKind, RecordingStatus } from "@/lib/types";

export interface IngestInput {
  file: Blob;
  fileName: string;
  mimeType: string;
  kind: RecordingKind;
  recordedAt: Date;
  durationSeconds: number | null;
}

export interface IngestResult {
  recordingId: string;
  status: RecordingStatus;
  momentCount?: number;
  commitmentCount?: number;
  errorMessage?: string | null;
}

export type IngestStage = "uploading" | RecordingStatus;

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const ACCEPTED_AUDIO = [
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/flac",
  "video/mp4", // some phones label voice memos this way
];

export function validateAudioFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const okType =
    ACCEPTED_AUDIO.includes(file.type.split(";")[0]) ||
    ["webm", "m4a", "mp4", "mp3", "mpeg", "mpga", "wav", "ogg", "oga", "flac"].includes(ext);
  if (!okType) return "That file type isn't supported. Use m4a, mp3, wav, webm, ogg or flac.";
  if (file.size > MAX_UPLOAD_BYTES) return "That file is over 25 MB. Try a recording under about 15 minutes.";
  if (file.size === 0) return "That file is empty.";
  return null;
}

/** Best-effort duration from the browser; null if the container doesn't say. */
export function probeDuration(file: Blob): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (v: number | null) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () =>
      done(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null);
    audio.onerror = () => done(null);
    setTimeout(() => done(null), 4000);
    audio.src = url;
  });
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * PHASE 1a DESIGN PREVIEW ONLY: steps through the real status sequence so the
 * capture UI can be reviewed. Nothing is uploaded or stored. Replaced by the
 * real pipeline (signed upload -> register -> process -> poll) in Phase 2.
 */
export async function previewIngest(
  _input: IngestInput,
  onStage: (stage: IngestStage) => void,
): Promise<IngestResult> {
  if (!DESIGN_PREVIEW) {
    throw new Error("Saving recordings is being wired up next. Nothing was uploaded.");
  }
  onStage("uploading");
  await wait(900);
  onStage("transcribing");
  await wait(1600);
  onStage("analyzing");
  await wait(1600);
  onStage("completed");
  return { recordingId: "sample-r1", status: "completed", momentCount: 2, commitmentCount: 1 };
}

export const ingest = previewIngest;
export const IS_PREVIEW_INGEST = true;
