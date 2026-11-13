"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardPaste, FileAudio, Loader2, Mic, ShieldCheck, Sparkles, Square, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client/api";
import { formatDuration } from "@/lib/format";
import type { ConversationSource } from "@/lib/projects/types";
import { AUDIO_BUCKET } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/browser";
import { MAX_RECORDING_SECONDS, useRecorder } from "./use-recorder";
import { Waveform } from "./waveform";

interface Segment {
  speaker: string | null;
  text: string;
}
interface IntakeResponse {
  projectId: string;
  conversationId: string;
  createdProject: boolean;
  duplicate: boolean;
  analysis: { ok: true; findings: number } | { ok: false; error: string };
}

type Step = { k: "idle" } | { k: "busy"; label: string; detail?: string } | { k: "paste"; text: string };

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const AUDIO_EXT = /\.(webm|m4a|mp4|mp3|mpeg|mpga|wav|ogg|oga|flac)$/i;

function extFor(mime: string, name?: string) {
  const fromName = name?.match(AUDIO_EXT)?.[1];
  if (fromName) return fromName.toLowerCase();
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("flac")) return "flac";
  return "webm";
}

/**
 * Press record, press stop: SERA transcribes, works out who the client is,
 * files the call under the right project (or creates one from what was said)
 * and compares it with the agreement. Everything can be corrected afterwards.
 */
export function CaptureFlow({ userId }: { userId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>({ k: "idle" });
  const stopRef = useRef<() => void>(() => {});
  const rec = useRecorder({ onAutoStop: () => stopRef.current() });

  const fail = (e: unknown, back: Step = { k: "idle" }) => {
    toast.error(e instanceof Error ? e.message : "Something went wrong. Try again.");
    setStep(back);
  };

  /** Hand the conversation to the server and open the result. */
  const intake = async (body: { segments?: Segment[]; transcript?: string; source: ConversationSource; recorded_at: string }) => {
    setStep({ k: "busy", label: "Setting up the project…", detail: "Finding the client and comparing the call with what was agreed." });
    const res = await api<IntakeResponse>("/api/intake", "POST", body);
    if (res.duplicate) toast("This conversation was already added.");
    else if (!res.analysis.ok) toast.error(`${res.analysis.error} You can retry from the conversation page.`);
    else toast.success(res.analysis.findings ? `Found ${res.analysis.findings} item${res.analysis.findings === 1 ? "" : "s"} to look at.` : "Analyzed. Nothing relevant found.");
    router.push(`/projects/${res.projectId}/conversations/${res.conversationId}${res.createdProject ? "?created=1" : ""}`);
  };

  const fromAudio = async (blob: Blob, mime: string, source: ConversationSource, recordedAt: Date, name?: string) => {
    if (blob.size > MAX_UPLOAD_BYTES) return fail(new Error("That audio is over 25 MB. Try a shorter recording."));
    try {
      setStep({ k: "busy", label: "Uploading…" });
      const path = `${userId}/${crypto.randomUUID()}.${extFor(mime, name)}`;
      const { error } = await createClient().storage.from(AUDIO_BUCKET).upload(path, blob, { contentType: mime, upsert: false });
      if (error) throw new Error("Couldn't upload the audio. Try again.");
      setStep({ k: "busy", label: "Transcribing…", detail: "Separating the voices." });
      const t = await api<{ segments: Segment[] }>("/api/transcribe", "POST", { path, mime_type: mime });
      await intake({ segments: t.segments, source, recorded_at: recordedAt.toISOString() });
    } catch (e) {
      fail(e);
    }
  };

  const stopRecording = async () => {
    const audio = await rec.stop();
    if (!audio) return fail(new Error("Nothing was recorded. Try again."));
    await fromAudio(audio.blob, audio.mimeType, "recording", audio.startedAt);
  };
  // The recorder auto-stops at the time limit; point it at the latest stop handler.
  useEffect(() => {
    stopRef.current = () => void stopRecording();
  });

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("audio/") && !file.type.startsWith("video/") && !AUDIO_EXT.test(file.name)) {
      return toast.error("Use an audio file: m4a, mp3, wav, webm, ogg or flac.");
    }
    await fromAudio(file, file.type || "audio/webm", "upload", new Date(file.lastModified || Date.now()), file.name);
  };

  // ------------------------------------------------------------ render
  if (rec.state === "recording" || rec.state === "requesting") {
    return (
      <section className="flex flex-col items-center gap-8 py-10 text-center">
        <p className="eyebrow">Recording · everyone on the call should know</p>
        <div className="flex items-center gap-4 rounded-full border-2 border-ink bg-ink py-3 pr-3 pl-5 text-cream shadow-[0_10px_30px_-12px_rgba(26,26,26,0.7)]">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-flare opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-flare" />
          </span>
          <Waveform analyserRef={rec.analyserRef} />
          <span className="w-14 font-mono text-sm tabular-nums">{formatDuration(rec.elapsed)}</span>
          <Button variant="cream" size="sm" onClick={() => void stopRecording()} disabled={rec.state !== "recording"}>
            <Square className="fill-current" />
            Stop
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-cream hover:bg-cream/10" aria-label="Cancel recording" onClick={() => rec.cancel()}>
            <X />
          </Button>
        </div>
        <p className="max-w-sm text-sm text-ink-muted">
          Up to {Math.round(MAX_RECORDING_SECONDS / 60)} minutes. Press Stop when the call ends; SERA does the rest.
        </p>
      </section>
    );
  }

  if (step.k === "busy") {
    return (
      <section className="flex flex-col items-center gap-3 py-16 text-center" aria-live="polite">
        <Loader2 className="size-8 animate-spin text-purple" />
        <p className="display text-3xl">{step.label}</p>
        {step.detail && <p className="text-sm text-ink-muted">{step.detail}</p>}
      </section>
    );
  }

  if (step.k === "paste") {
    return (
      <section className="surface-raised flex flex-col gap-4 p-5 text-left sm:p-7 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-start justify-between gap-3">
          <h2 className="display text-3xl">
            Paste a <em>transcript</em>
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setStep({ k: "idle" })}>
            <ArrowLeft />
            Back
          </Button>
        </div>
        <p className="text-sm text-ink-muted">
          Speaker labels like <span className="font-mono text-ink">Client:</span> and <span className="font-mono text-ink">Freelancer:</span> help SERA
          tell who asked from who agreed.
        </p>
        <Textarea
          value={step.text}
          onChange={(e) => setStep({ k: "paste", text: e.target.value })}
          placeholder={"Client: Can we also add Stripe payments to the website?\nFreelancer: I can look into it, but I'll need to estimate the extra work first."}
          className="max-h-96 min-h-48 font-mono text-[0.8125rem]"
          autoFocus
        />
        <Button
          className="self-end"
          disabled={!step.text.trim()}
          onClick={() => {
            const text = step.text;
            intake({ transcript: text, source: "paste", recorded_at: new Date().toISOString() }).catch((e) => fail(e, { k: "paste", text }));
          }}
        >
          <Sparkles />
          Analyze
        </Button>
      </section>
    );
  }

  // idle
  return (
    <section className="flex flex-col items-center gap-7 py-6 text-center sm:py-10">
      <button
        type="button"
        onClick={() => void rec.start()}
        aria-label="Start recording"
        className="group flex size-36 items-center justify-center rounded-full border-2 border-ink bg-ink text-dawn shadow-[0_18px_40px_-16px_rgba(26,26,26,0.75)] transition-transform hover:scale-[1.03] active:scale-95 sm:size-44"
      >
        <Mic className="size-12 transition-transform group-hover:scale-110 sm:size-14" />
      </button>
      <div className="flex flex-col gap-1">
        <p className="display text-3xl">Tap to record the call</p>
        <p className="text-sm text-ink-muted">SERA files it under the right project, or creates one from what was said.</p>
      </div>
      {rec.error && <p className="rounded-card bg-error-bg px-4 py-3 text-sm font-semibold text-pulse">{rec.error}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <FileAudio />
          Upload audio
        </Button>
        <Button variant="outline" onClick={() => setStep({ k: "paste", text: "" })}>
          <ClipboardPaste />
          Paste transcript
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*,.m4a,.mp3,.wav,.webm,.ogg,.flac"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      <p className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
        <ShieldCheck className="size-3.5" />
        Let everyone on the call know you&apos;re recording. Audio is deleted after transcription.
      </p>
    </section>
  );
}
