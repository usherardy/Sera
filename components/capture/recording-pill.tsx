"use client";

import Link from "next/link";
import { AlertTriangle, Check, Loader2, RotateCcw, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format";
import { useCapture } from "./capture-provider";
import { Waveform } from "./waveform";
import { IS_PREVIEW_INGEST, type IngestStage } from "./ingest";
import { MAX_RECORDING_SECONDS } from "./use-recorder";

const STAGE_COPY: Record<IngestStage, string> = {
  uploading: "Uploading…",
  uploaded: "Queued…",
  transcribing: "Transcribing…",
  analyzing: "Finding moments…",
  completed: "Wrapping up…",
  failed: "Couldn't process",
};

/** Floating status pill, always visible while recording or processing. */
export function RecordingPill() {
  const { state, elapsed, analyserRef, stopRecording, cancelRecording, submit, dismiss } = useCapture();
  if (state.phase === "idle") return null;

  const nearLimit = state.phase === "recording" && MAX_RECORDING_SECONDS - elapsed <= 60;

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-40 flex justify-center px-4",
        "bottom-[calc(env(safe-area-inset-bottom)+6.25rem)] sm:bottom-8",
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "flex h-14 max-w-full items-center gap-3 rounded-full border-2 border-ink bg-ink pr-2 pl-4 text-cream",
          "shadow-[0_12px_32px_-12px_rgba(26,26,26,0.55)] animate-in fade-in slide-in-from-bottom-4 duration-300",
        )}
      >
        {state.phase === "recording" && (
          <>
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-flare opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-flare" />
            </span>
            <span className="font-mono text-sm tabular-nums">{formatDuration(elapsed)}</span>
            <Waveform analyserRef={analyserRef} className="hidden min-[380px]:flex" />
            {nearLimit && <span className="text-xs text-glow">Stops at 15:00</span>}
            <button
              onClick={cancelRecording}
              className="flex size-9 items-center justify-center rounded-full text-cream/70 hover:bg-cream/10 hover:text-cream"
              aria-label="Discard recording"
            >
              <X className="size-4" />
            </button>
            <button
              onClick={() => void stopRecording()}
              className="flex h-10 items-center gap-2 rounded-full bg-dawn px-4 text-sm font-semibold text-ink transition-transform active:scale-95"
            >
              <Square className="size-3.5 fill-ink" />
              Stop
            </button>
          </>
        )}

        {state.phase === "working" && (
          <>
            <Loader2 className="size-4 animate-spin text-dawn" />
            <span className="pr-3 text-sm font-semibold">{STAGE_COPY[state.stage]}</span>
            {IS_PREVIEW_INGEST && (
              <span className="mr-2 rounded-full bg-cream/15 px-2 py-0.5 font-mono text-[0.65rem] tracking-wider uppercase">
                Preview
              </span>
            )}
          </>
        )}

        {state.phase === "done" && (
          <>
            <span className="flex size-6 items-center justify-center rounded-full bg-success text-success-dark">
              <Check className="size-3.5" />
            </span>
            <span className="text-sm font-semibold">
              {summaryLine(state.momentCount, state.commitmentCount)}
            </span>
            <Link
              href={`/memory/${state.recordingId}`}
              onClick={dismiss}
              className="flex h-10 items-center rounded-full bg-dawn px-4 text-sm font-semibold text-ink"
            >
              View
            </Link>
          </>
        )}

        {state.phase === "failed" && (
          <>
            <AlertTriangle className="size-4 shrink-0 text-flare" />
            <span className="max-w-[14rem] truncate text-sm font-semibold sm:max-w-sm">{state.message}</span>
            {state.retry && (
              <button
                onClick={() => state.retry && void submit(state.retry)}
                className="flex h-10 items-center gap-1.5 rounded-full bg-dawn px-4 text-sm font-semibold text-ink"
              >
                <RotateCcw className="size-3.5" />
                Retry
              </button>
            )}
            <button
              onClick={dismiss}
              className="flex size-9 items-center justify-center rounded-full text-cream/70 hover:bg-cream/10"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function summaryLine(moments?: number, commitments?: number) {
  if (moments == null) return "Processed";
  const m = `${moments} moment${moments === 1 ? "" : "s"}`;
  const c = commitments ? ` · ${commitments} commitment${commitments === 1 ? "" : "s"}` : "";
  return `${m}${c}`;
}
