"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardPaste, FileAudio, Loader2, Mic, ShieldCheck, Square, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { api } from "@/lib/client/api";
import { formatDuration, formatDateOnly } from "@/lib/format";
import { formatMoney } from "@/lib/projects/meta";
import type { ProjectInputT } from "@/lib/projects/schemas";
import type { ConversationSource } from "@/lib/projects/types";
import { AUDIO_BUCKET } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { MAX_RECORDING_SECONDS, useRecorder } from "./use-recorder";
import { Waveform } from "./waveform";

interface Segment {
  speaker: string | null;
  text: string;
}
interface Transcription {
  segments: Segment[];
  diarized: boolean;
}
interface Draft {
  matched_project_id: string | null;
  match_reason: string;
  conversation_title: string;
  draft: ProjectInputT;
}
type Role = "client" | "me" | "other";

type Step =
  | { k: "idle" }
  | { k: "busy"; label: string }
  | { k: "speakers"; segments: Segment[] }
  | { k: "review"; transcript: string; hint: boolean }
  | { k: "project"; transcript: string; draft: Draft | null };

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

/** Merge consecutive segments by the same speaker and label them by role. */
function buildTranscript(segments: Segment[], roles: Record<string, Role>) {
  const label = (s: string | null) => {
    if (!s) return null;
    const r = roles[s];
    return r === "client" ? "Client" : r === "me" ? "Freelancer" : `Speaker ${s}`;
  };
  const lines: { who: string | null; text: string }[] = [];
  for (const seg of segments) {
    const who = label(seg.speaker);
    const last = lines[lines.length - 1];
    if (last && last.who === who) last.text += ` ${seg.text}`;
    else lines.push({ who, text: seg.text });
  }
  return lines.map((l) => (l.who ? `${l.who}: ${l.text}` : l.text)).join("\n");
}

function StepCard({ title, onBack, children }: { title: React.ReactNode; onBack?: () => void; children: React.ReactNode }) {
  return (
    <section className="surface-raised flex flex-col gap-5 p-5 sm:p-7 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start justify-between gap-3">
        <h2 className="display text-3xl sm:text-4xl">{title}</h2>
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft />
            Start over
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}

export function CaptureFlow({
  userId,
  projects,
}: {
  userId: string;
  projects: { id: string; name: string; client_name: string }[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>({ k: "idle" });
  const [source, setSource] = useState<ConversationSource>("recording");
  const [recordedAt, setRecordedAt] = useState<Date>(new Date());
  const [roles, setRoles] = useState<Record<string, Role>>({});
  const [title, setTitle] = useState("");
  const [targetId, setTargetId] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);
  const stopRef = useRef<() => void>(() => {});
  const rec = useRecorder({ onAutoStop: () => stopRef.current() });

  const reset = () => {
    rec.cancel();
    setStep({ k: "idle" });
    setRoles({});
    setTitle("");
    setTargetId("");
  };
  const fail = (e: unknown, back: Step = { k: "idle" }) => {
    toast.error(e instanceof Error ? e.message : "Something went wrong. Try again.");
    setStep(back);
  };

  // ------------------------------------------------------------ capture
  const transcribe = async (blob: Blob, mime: string, name?: string) => {
    if (blob.size > MAX_UPLOAD_BYTES) return fail(new Error("That audio is over 25 MB. Try a shorter recording."));
    try {
      setStep({ k: "busy", label: "Uploading…" });
      const path = `${userId}/${crypto.randomUUID()}.${extFor(mime, name)}`;
      const { error } = await createClient().storage.from(AUDIO_BUCKET).upload(path, blob, { contentType: mime, upsert: false });
      if (error) throw new Error("Couldn't upload the audio. Try again.");
      setStep({ k: "busy", label: "Transcribing and separating voices…" });
      const res = await api<Transcription>("/api/transcribe", "POST", { path, mime_type: mime });
      const speakers = new Set(res.segments.map((s) => s.speaker).filter(Boolean));
      if (res.diarized && speakers.size > 0) setStep({ k: "speakers", segments: res.segments });
      else setStep({ k: "review", transcript: res.segments.map((s) => s.text).join("\n"), hint: true });
    } catch (e) {
      fail(e);
    }
  };

  const startRecording = async () => {
    setSource("recording");
    setRecordedAt(new Date());
    await rec.start();
  };
  const stopRecording = async () => {
    const audio = await rec.stop();
    if (!audio) return fail(new Error("Nothing was recorded. Try again."));
    setRecordedAt(audio.startedAt);
    await transcribe(audio.blob, audio.mimeType);
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
    setSource("upload");
    setRecordedAt(new Date(file.lastModified || Date.now()));
    await transcribe(file, file.type || "audio/webm", file.name);
  };

  // ------------------------------------------------------------ project
  const toProjectStep = async (transcript: string) => {
    if (!transcript.trim()) return toast.error("The transcript is empty.");
    setStep({ k: "busy", label: "Finding the project…" });
    try {
      const draft = await api<Draft>("/api/intake/draft", "POST", { transcript, recorded_at: recordedAt.toISOString() });
      setTitle(draft.conversation_title);
      setTargetId(draft.matched_project_id ?? "");
      setStep({ k: "project", transcript, draft });
    } catch (e) {
      // The draft is a convenience: without it the user can still pick or create a project.
      toast.error(e instanceof Error ? e.message : "Couldn't draft a project.");
      setTitle("Client conversation");
      setStep({ k: "project", transcript, draft: null });
    }
  };

  const saveTo = async (projectId: string, transcript: string) => {
    setStep({ k: "busy", label: "Comparing with the original agreement…" });
    try {
      const res = await api<{ id: string; status: string; error?: string; duplicate?: boolean; findings?: number }>(
        `/api/projects/${projectId}/conversations`,
        "POST",
        { title: title.trim() || "Client conversation", transcript: transcript.trim(), source, recorded_at: recordedAt.toISOString() },
      );
      if (res.duplicate) toast("That conversation was already added to this project.");
      else if (res.status === "failed") toast.error(res.error ?? "Saved, but the analysis failed. You can retry it.");
      else toast.success(res.findings ? `Found ${res.findings} item${res.findings === 1 ? "" : "s"} to look at.` : "Analyzed. Nothing relevant found.");
      router.push(`/projects/${projectId}/conversations/${res.id}`);
    } catch (e) {
      fail(e, { k: "project", transcript, draft: step.k === "project" ? step.draft : null });
    }
  };

  // ------------------------------------------------------------ render
  const speakerList = useMemo(() => {
    if (step.k !== "speakers") return [];
    const by = new Map<string, string[]>();
    for (const s of step.segments) if (s.speaker) by.set(s.speaker, [...(by.get(s.speaker) ?? []), s.text]);
    return [...by.entries()].map(([speaker, lines]) => ({ speaker, lines }));
  }, [step]);

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
          <Button variant="ghost" size="icon-sm" className="text-cream hover:bg-cream/10" aria-label="Cancel recording" onClick={reset}>
            <X />
          </Button>
        </div>
        <p className="max-w-sm text-sm text-ink-muted">
          Up to {Math.round(MAX_RECORDING_SECONDS / 60)} minutes. Audio is used only to make the transcript and is then deleted.
        </p>
      </section>
    );
  }

  if (step.k === "busy") {
    return (
      <section className="flex flex-col items-center gap-4 py-16 text-center">
        <Loader2 className="size-8 animate-spin text-purple" />
        <p className="display text-3xl">{step.label}</p>
      </section>
    );
  }

  if (step.k === "speakers") {
    const hasClient = Object.values(roles).includes("client");
    return (
      <StepCard
        title={
          <>
            Who&apos;s the <em>client</em>?
          </>
        }
        onBack={reset}
      >
        <p className="text-sm text-ink-muted">SERA separated the voices. Tag who&apos;s who so it can tell a client request from your agreement.</p>
        <ul className="flex flex-col gap-3">
          {speakerList.map(({ speaker, lines }) => (
            <li key={speaker} className="flex flex-col gap-3 rounded-card border-2 border-cream-dark bg-paper p-4">
              <p className="eyebrow">Speaker {speaker}</p>
              <p className="font-serif text-lg leading-snug italic">“{lines.slice(0, 2).join(" ").slice(0, 220)}{lines.join(" ").length > 220 ? "…" : ""}”</p>
              <div className="grid grid-cols-3 gap-1 rounded-lg border-2 border-cream-dark bg-cream p-1">
                {(["client", "me", "other"] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoles((prev) => ({ ...prev, [speaker]: r }))}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                      roles[speaker] === r ? "bg-dawn text-ink" : "text-ink/60 hover:text-ink",
                    )}
                  >
                    {r === "client" ? "Client" : r === "me" ? "Me" : "Someone else"}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => setStep({ k: "review", transcript: buildTranscript(step.segments, {}), hint: true })}
          >
            Skip, I&apos;ll label it myself
          </Button>
          <Button disabled={!hasClient} onClick={() => setStep({ k: "review", transcript: buildTranscript(step.segments, roles), hint: false })}>
            Continue
          </Button>
        </div>
      </StepCard>
    );
  }

  if (step.k === "review") {
    return (
      <StepCard
        title={
          <>
            Check the <em>transcript</em>
          </>
        }
        onBack={reset}
      >
        {step.hint && (
          <p className="rounded-card bg-warning px-4 py-3 text-sm font-semibold text-warning-dark">
            Start lines with <span className="font-mono">Client:</span> or <span className="font-mono">Freelancer:</span> where it matters. Without
            labels SERA can&apos;t tell who asked from who agreed.
          </p>
        )}
        <Textarea
          value={step.transcript}
          onChange={(e) => setStep({ ...step, transcript: e.target.value })}
          placeholder={"Client: Can we also add Stripe payments to the website?\nFreelancer: I can look into it, but I'll need to estimate the extra work first."}
          className="max-h-96 min-h-56 font-mono text-[0.8125rem]"
          autoFocus={!step.transcript}
        />
        <div className="flex justify-end">
          <Button onClick={() => void toProjectStep(step.transcript)} disabled={!step.transcript.trim()}>
            Continue
          </Button>
        </div>
      </StepCard>
    );
  }

  if (step.k === "project") {
    const d = step.draft;
    const matched = d?.matched_project_id ? projects.find((p) => p.id === d.matched_project_id) : undefined;
    const chosen = projects.find((p) => p.id === targetId);
    return (
      <StepCard
        title={
          <>
            Which <em>project</em>?
          </>
        }
        onBack={reset}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="cap-title">Conversation title</Label>
          <Input id="cap-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        {matched && (
          <div className="rounded-card border-2 border-ink bg-dawn/40 p-4">
            <p className="eyebrow">Looks like</p>
            <p className="display mt-1 text-2xl">{matched.name}</p>
            {d?.match_reason && <p className="mt-1 text-sm text-ink-muted">{d.match_reason}</p>}
          </div>
        )}

        {projects.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="cap-project">Add to an existing project</Label>
            <select
              id="cap-project"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="h-11 rounded-lg border-2 border-input bg-paper px-3 text-sm"
            >
              <option value="">Choose a project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.client_name}
                </option>
              ))}
            </select>
            <Button className="self-start" disabled={!chosen} onClick={() => chosen && void saveTo(chosen.id, step.transcript)}>
              {chosen ? `Add to ${chosen.name} and analyze` : "Add and analyze"}
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-card border-2 border-dashed border-cream-dark p-4">
          <div>
            <p className="font-semibold">{projects.length > 0 ? "Or start a new project" : "Start a new project"}</p>
            <p className="text-sm text-ink-muted">
              {d ? "SERA drafted the agreement from what was said. You check it before it's saved." : "Enter the agreement yourself."}
            </p>
          </div>
          {d && (
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="eyebrow">Project</dt>
                <dd className="font-semibold">{d.draft.name}</dd>
              </div>
              <div>
                <dt className="eyebrow">Client</dt>
                <dd className="font-semibold">{d.draft.client_name || "Not said"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="eyebrow">Deliverables mentioned</dt>
                <dd>{d.draft.agreed_scope.length ? d.draft.agreed_scope.join(" · ") : "None stated"}</dd>
              </div>
              <div>
                <dt className="eyebrow">Price</dt>
                <dd>{d.draft.fixed_price != null ? formatMoney(d.draft.fixed_price, d.draft.currency) : "Not stated"}</dd>
              </div>
              <div>
                <dt className="eyebrow">Deadline</dt>
                <dd>{d.draft.deadline ? formatDateOnly(d.draft.deadline) : "Not stated"}</dd>
              </div>
            </dl>
          )}
          <Button variant={matched ? "outline" : "default"} className="self-start" onClick={() => setFormOpen(true)}>
            {d ? "Review and create project" : "Create project"}
          </Button>
        </div>

        {formOpen && (
          <ProjectFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            initial={d?.draft}
            drafted={!!d}
            onCreated={(id) => saveTo(id, step.transcript)}
          />
        )}
      </StepCard>
    );
  }

  // idle
  return (
    <section className="flex flex-col items-center gap-7 py-6 text-center sm:py-10">
      <button
        type="button"
        onClick={() => void startRecording()}
        aria-label="Start recording"
        className="group flex size-36 items-center justify-center rounded-full border-2 border-ink bg-ink text-dawn shadow-[0_18px_40px_-16px_rgba(26,26,26,0.75)] transition-transform hover:scale-[1.03] active:scale-95 sm:size-44"
      >
        <Mic className="size-12 transition-transform group-hover:scale-110 sm:size-14" />
      </button>
      <div className="flex flex-col gap-1">
        <p className="display text-3xl">Tap to record the call</p>
        <p className="text-sm text-ink-muted">SERA files it under the right project, or drafts a new one for you to confirm.</p>
      </div>
      {rec.error && <p className="rounded-card bg-error-bg px-4 py-3 text-sm font-semibold text-pulse">{rec.error}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <FileAudio />
          Upload audio
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setSource("paste");
            setRecordedAt(new Date());
            setStep({ k: "review", transcript: "", hint: true });
          }}
        >
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
