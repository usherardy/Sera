"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { RecordingKind } from "@/lib/types";
import { useRecorder } from "./use-recorder";
import { ingest, type IngestInput, type IngestStage } from "./ingest";

export type CapturePhase =
  | { phase: "idle" }
  | { phase: "recording"; kind: RecordingKind }
  | { phase: "working"; stage: IngestStage }
  | { phase: "done"; recordingId: string; momentCount?: number; commitmentCount?: number }
  | { phase: "failed"; message: string; retry?: IngestInput };

interface CaptureContextValue {
  sheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
  state: CapturePhase;
  elapsed: number;
  recorderError: string | null;
  analyserRef: ReturnType<typeof useRecorder>["analyserRef"];
  startRecording: (kind: RecordingKind) => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  submit: (input: IngestInput) => Promise<void>;
  dismiss: () => void;
}

const CaptureContext = createContext<CaptureContextValue | null>(null);

export function useCapture() {
  const ctx = useContext(CaptureContext);
  if (!ctx) throw new Error("useCapture must be used inside <CaptureProvider>");
  return ctx;
}

export function CaptureProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [state, setState] = useState<CapturePhase>({ phase: "idle" });
  const stopRef = useRef<() => void>(() => {});
  const recorder = useRecorder({ onAutoStop: () => stopRef.current() });

  const submit = useCallback(
    async (input: IngestInput) => {
      setSheetOpen(false);
      setState({ phase: "working", stage: "uploading" });
      try {
        const result = await ingest(input, (stage) => setState({ phase: "working", stage }));
        if (result.status === "failed") {
          setState({
            phase: "failed",
            message: result.errorMessage ?? "We couldn't process this recording. Try again.",
            retry: input,
          });
          return;
        }
        setState({
          phase: "done",
          recordingId: result.recordingId,
          momentCount: result.momentCount,
          commitmentCount: result.commitmentCount,
        });
        router.refresh();
      } catch (e) {
        setState({
          phase: "failed",
          message: e instanceof Error ? e.message : "Upload failed. Check your connection and try again.",
          retry: input,
        });
      }
    },
    [router],
  );

  const kindRef = useRef<RecordingKind>("conversation");

  const stopRecording = useCallback(async () => {
    const audio = await recorder.stop();
    if (!audio) {
      setState({ phase: "failed", message: "Nothing was recorded. Try again." });
      return;
    }
    const ext = audio.mimeType.includes("mp4") ? "m4a" : audio.mimeType.includes("mpeg") ? "mp3" : "webm";
    await submit({
      file: audio.blob,
      fileName: `recording.${ext}`,
      mimeType: audio.mimeType,
      kind: kindRef.current,
      recordedAt: audio.startedAt,
      durationSeconds: audio.durationSeconds,
    });
  }, [recorder, submit]);

  useEffect(() => {
    stopRef.current = () => void stopRecording();
  }, [stopRecording]);

  const startRecording = useCallback(
    async (kind: RecordingKind) => {
      kindRef.current = kind;
      if (await recorder.start()) {
        setSheetOpen(false);
        setState({ phase: "recording", kind });
      }
    },
    [recorder],
  );

  const cancelRecording = useCallback(() => {
    recorder.cancel();
    setState({ phase: "idle" });
  }, [recorder]);

  const dismiss = useCallback(() => setState({ phase: "idle" }), []);

  // Make an active recording impossible to miss: tab title + leave warning.
  const isRecording = state.phase === "recording";
  useEffect(() => {
    if (!isRecording) return;
    const prev = document.title;
    document.title = "● Recording · SERA";
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => {
      document.title = prev;
      window.removeEventListener("beforeunload", warn);
    };
  }, [isRecording]);

  // Auto-hide the success pill.
  useEffect(() => {
    if (state.phase !== "done") return;
    const t = setTimeout(() => setState({ phase: "idle" }), 9000);
    return () => clearTimeout(t);
  }, [state]);

  const value = useMemo<CaptureContextValue>(
    () => ({
      sheetOpen,
      openSheet: () => setSheetOpen(true),
      closeSheet: () => setSheetOpen(false),
      state,
      elapsed: recorder.elapsed,
      recorderError: recorder.error,
      analyserRef: recorder.analyserRef,
      startRecording,
      stopRecording,
      cancelRecording,
      submit,
      dismiss,
    }),
    [sheetOpen, state, recorder.elapsed, recorder.error, recorder.analyserRef, startRecording, stopRecording, cancelRecording, submit, dismiss],
  );

  return <CaptureContext.Provider value={value}>{children}</CaptureContext.Provider>;
}
