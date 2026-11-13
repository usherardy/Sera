import "server-only";
import { toFile } from "openai";
import type { TranscriptionDiarized } from "openai/resources/audio/transcriptions";
import { AIError, openai, toAIError } from "./openai";

export interface SpeakerSegment {
  /** "A", "B", … from the diarizing model; null when speakers couldn't be separated */
  speaker: string | null;
  text: string;
  start: number | null;
  end: number | null;
}

export interface TranscriptionResult {
  segments: SpeakerSegment[];
  /** true when the model separated speakers */
  diarized: boolean;
}

const DIARIZE_MODEL = "gpt-4o-transcribe-diarize";

/**
 * Transcribe audio, separating speakers when the diarizing model is available.
 * Falls back to plain transcription (no speaker labels) with OPENAI_TRANSCRIBE_MODEL.
 */
export async function transcribeAudio(bytes: ArrayBuffer, fileName: string, mimeType: string): Promise<TranscriptionResult> {
  const file = () => toFile(Buffer.from(bytes), fileName, { type: mimeType });

  try {
    const res = (await openai().audio.transcriptions.create({
      file: await file(),
      model: DIARIZE_MODEL,
      response_format: "diarized_json",
      chunking_strategy: "auto",
    })) as unknown as TranscriptionDiarized;
    const segments = (res.segments ?? [])
      .map((s) => ({ speaker: s.speaker || null, text: s.text.trim(), start: s.start ?? null, end: s.end ?? null }))
      .filter((s) => s.text);
    if (segments.length > 0) return { segments, diarized: true };
    if (res.text?.trim()) return { segments: [{ speaker: null, text: res.text.trim(), start: null, end: null }], diarized: false };
    throw new AIError("No speech was found in that recording.");
  } catch (e) {
    if (e instanceof AIError) throw e;
    const mapped = toAIError(e, "transcription");
    // Credits or key problems won't be fixed by another model; surface them.
    if (/credits|key was rejected|isn't configured|rate limiting/.test(mapped.message)) throw mapped;
  }

  // Fallback: plain transcript, the user adds speaker labels.
  try {
    const res = await openai().audio.transcriptions.create({
      file: await file(),
      model: process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-transcribe",
      response_format: "json",
    });
    const text = res.text?.trim();
    if (!text) throw new AIError("No speech was found in that recording.");
    return { segments: [{ speaker: null, text, start: null, end: null }], diarized: false };
  } catch (e) {
    throw toAIError(e, "transcription");
  }
}
