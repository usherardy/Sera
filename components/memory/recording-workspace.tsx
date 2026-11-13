"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { formatOffset } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TranscriptSegment } from "@/lib/types";

/** Normalize for quote matching: lowercase, letters/digits only, single spaces. */
function norm(t: string) {
  return t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/** Audio player + transcript, linked: timestamps seek, playback highlights the active line. */
export function RecordingWorkspace({
  audioUrl,
  durationSeconds,
  segments,
  evidence,
  initialMs,
}: {
  audioUrl: string | null;
  durationSeconds: number | null;
  segments: TranscriptSegment[];
  /** verbatim quotes backing moments/tasks; matching segments are highlighted */
  evidence: string[];
  initialMs: number | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(initialMs ?? 0);
  const [focusMs] = useState(initialMs);
  const segRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  const totalMs = (durationSeconds ?? 0) * 1000;

  const isEvidence = useMemo(() => {
    const quotes = evidence.map(norm).filter(Boolean);
    return (s: TranscriptSegment) => {
      const t = norm(s.text);
      return !!t && quotes.some((q) => q.includes(t) || t.includes(q));
    };
  }, [evidence]);

  const activeIdx = segments.findIndex(
    (s) => s.start_ms != null && s.end_ms != null && currentMs >= s.start_ms && currentMs < s.end_ms,
  );
  const focusIdx =
    focusMs == null ? -1 : segments.findIndex((s) => s.start_ms != null && s.end_ms != null && focusMs >= s.start_ms && focusMs < s.end_ms);

  useEffect(() => {
    if (focusIdx < 0) return;
    segRefs.current.get(focusIdx)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusIdx]);

  const seek = (ms: number) => {
    setCurrentMs(ms);
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = ms / 1000;
    void a.play();
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="surface-raised flex items-center gap-4 p-3 pr-5">
        <button
          onClick={toggle}
          disabled={!audioUrl}
          aria-label={playing ? "Pause" : "Play"}
          className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-dawn transition-transform active:scale-95 disabled:opacity-40"
        >
          {playing ? <Pause className="size-5 fill-ink" /> : <Play className="ml-0.5 size-5 fill-ink" />}
        </button>
        {!audioUrl ? (
          <p className="flex-1 text-sm text-ink-muted">Audio isn&apos;t available for sample recordings. The transcript is below.</p>
        ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            type="range"
            min={0}
            max={Math.max(1, totalMs)}
            value={Math.min(currentMs, totalMs)}
            disabled={!audioUrl}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Playback position"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-cream-dark accent-ink disabled:cursor-default"
          />
          <div className="flex justify-between font-mono text-xs text-ink-muted">
            <span>{formatOffset(currentMs)}</span>
            <span>{formatOffset(totalMs)}</span>
          </div>
        </div>
        )}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setCurrentMs(e.currentTarget.currentTime * 1000)}
          />
        )}
      </div>

      <section id="transcript" className="flex scroll-mt-28 flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="display text-3xl">Transcript</h2>
          <span className="flex items-center gap-2 text-xs text-ink-muted">
            <span className="h-3 w-5 rounded-sm bg-dawn" />
            Evidence for a moment or task
          </span>
        </div>
        {segments.length === 0 ? (
          <p className="text-sm text-ink-muted">No transcript yet.</p>
        ) : (
          <ol className="surface flex flex-col divide-y-2 divide-cream-dark/60 overflow-hidden">
            {segments.map((s, i) => (
              <li
                key={s.id}
                ref={(el) => {
                  if (el) segRefs.current.set(i, el);
                }}
                className={cn(
                  "flex gap-4 px-4 py-3 transition-colors sm:px-5",
                  i === activeIdx && playing && "bg-secondary",
                  i === focusIdx && "bg-dawn/40",
                )}
              >
                <button
                  onClick={() => s.start_ms != null && seek(s.start_ms)}
                  disabled={s.start_ms == null}
                  className="shrink-0 pt-0.5 font-mono text-xs text-ink-muted hover:text-ink disabled:cursor-default"
                  title={s.start_ms == null ? "Timing unavailable" : "Play from here"}
                >
                  {s.start_ms != null ? formatOffset(s.start_ms) : "--:--"}
                </button>
                <p className={cn("text-[0.9375rem] leading-relaxed", isEvidence(s) && "rounded-sm bg-dawn/70 px-1 -mx-1 box-decoration-clone")}>
                  {s.speaker_label && <span className="mr-1.5 font-semibold">{s.speaker_label}:</span>}
                  {s.text}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
