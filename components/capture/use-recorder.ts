"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState = "idle" | "requesting" | "recording" | "error";

export interface RecordedAudio {
  blob: Blob;
  mimeType: string;
  startedAt: Date;
  durationSeconds: number;
}

/** Bounded so files stay well under the 25 MB transcription limit. */
export const MAX_RECORDING_SECONDS = 15 * 60;

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4", // iOS Safari
  "audio/mpeg",
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t));
}

/**
 * Explicit start/stop browser recording with a live analyser for the waveform.
 * Nothing records until start() is called from a user gesture, and the
 * microphone is released on stop/cancel/unmount.
 */
export function useRecorder({ onAutoStop }: { onAutoStop?: () => void } = {}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const onAutoStopRef = useRef(onAutoStop);
  useEffect(() => {
    onAutoStopRef.current = onAutoStop;
  }, [onAutoStop]);

  const release = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => release, [release]);

  /** Resolves true once recording has actually started. */
  const start = useCallback(async (): Promise<boolean> => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser can't record audio. Try uploading a file instead.");
      setState("error");
      return false;
    }
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType, audioBitsPerSecond: 64_000 } : undefined,
      );
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(1000);
      recorderRef.current = recorder;

      try {
        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.75;
        ctx.createMediaStreamSource(stream).connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
      } catch {
        // Waveform is decorative; recording still works without it.
      }

      startedAtRef.current = new Date();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startedAtRef.current!.getTime()) / 1000);
        setElapsed(secs);
        if (secs >= MAX_RECORDING_SECONDS) onAutoStopRef.current?.();
      }, 250);
      setState("recording");
      return true;
    } catch (e) {
      release();
      const denied = e instanceof DOMException && e.name === "NotAllowedError";
      setError(
        denied
          ? "Microphone access was blocked. Allow it in your browser settings, or upload a file."
          : "Couldn't start the microphone. Try again or upload a file.",
      );
      setState("error");
      return false;
    }
  }, [release]);

  const stop = useCallback((): Promise<RecordedAudio | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return Promise.resolve(null);
    return new Promise((resolve) => {
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const startedAt = startedAtRef.current ?? new Date();
        const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 1000));
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        recorderRef.current = null;
        release();
        setState("idle");
        resolve(blob.size > 0 ? { blob, mimeType, startedAt, durationSeconds } : null);
      };
      recorder.stop();
    });
  }, [release]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    recorderRef.current = null;
    chunksRef.current = [];
    release();
    setState("idle");
  }, [release]);

  return { state, elapsed, error, start, stop, cancel, analyserRef };
}
