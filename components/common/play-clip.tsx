"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * "Play the receipt": plays exactly the part of the recording a moment or task
 * came from (start_ms → end_ms). The signed audio URL is fetched only on first
 * play from GET /api/recordings/[id]/audio (Phase 2). Renders nothing when the
 * clip can't be played (sample data has no audio, or timing is unknown).
 */
export function PlayClip({
  recordingId,
  startMs,
  endMs,
  available,
  className,
  tone = "light",
}: {
  recordingId: string;
  startMs: number | null;
  endMs: number | null;
  available: boolean;
  className?: string;
  tone?: "light" | "dark";
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");

  useEffect(() => () => audioRef.current?.pause(), []);

  if (!available || startMs == null) return null;
  const seconds = endMs != null ? Math.max(1, Math.round((endMs - startMs) / 1000)) : null;

  const play = async () => {
    if (state === "playing") {
      audioRef.current?.pause();
      setState("idle");
      return;
    }
    try {
      setState("loading");
      let audio = audioRef.current;
      if (!audio) {
        const res = await fetch(`/api/recordings/${recordingId}/audio`);
        if (!res.ok) throw new Error();
        const { url } = (await res.json()) as { url: string };
        audio = new Audio(url);
        audio.preload = "auto";
        audio.addEventListener("timeupdate", () => {
          if (endMs != null && audio!.currentTime * 1000 >= endMs) {
            audio!.pause();
            setState("idle");
          }
        });
        audio.addEventListener("ended", () => setState("idle"));
        audioRef.current = audio;
      }
      audio.currentTime = startMs / 1000;
      await audio.play();
      setState("playing");
    } catch {
      setState("idle");
      toast.error("Couldn't play this clip. Try opening the recording.");
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void play();
      }}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border-2 px-3 text-xs font-semibold transition-colors",
        tone === "dark"
          ? "border-cream/30 text-cream hover:border-cream/60"
          : "border-cream-dark bg-paper text-ink hover:border-ink/40",
        state === "playing" && (tone === "dark" ? "border-dawn bg-dawn text-ink" : "border-ink bg-dawn"),
        className,
      )}
      aria-label={state === "playing" ? "Pause clip" : "Play what was said"}
    >
      {state === "loading" ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : state === "playing" ? (
        <Pause className="size-3.5 fill-current" />
      ) : (
        <Play className="size-3.5 fill-current" />
      )}
      {state === "playing" ? "Playing" : "Hear it"}
      {seconds != null && <span className="font-mono font-normal opacity-70">{seconds}s</span>}
    </button>
  );
}
