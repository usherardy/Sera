"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUp, CheckSquare, Clipboard, FolderKanban, Loader2, Mail, MessagesSquare, Mic, Sparkles, Square, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Waveform } from "@/components/capture/waveform";
import { useRecorder } from "@/components/capture/use-recorder";
import { FindingBadge } from "@/components/projects/project-bits";
import { api } from "@/lib/client/api";
import type { AskDraft, AskResponse, AskSource } from "@/lib/ask/types";
import { cn } from "@/lib/utils";

/** Long enough for a question, short enough to stay fast and small. */
const MAX_QUESTION_SECONDS = 45;

type Phase = "idle" | "recording" | "transcribing" | "thinking";

function extFor(mime: string) {
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("mpeg")) return "mp3";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

/**
 * "Ask Sera": type or say a question about your clients. Answers come only
 * from your calls, with links to the exact findings; email requests come back
 * as a draft you review and send yourself. Nothing is sent or changed.
 */
export function AskBar({ projectId, suggestions, placeholder }: { projectId?: string; suggestions: string[]; placeholder?: string }) {
  const [q, setQ] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [asked, setAsked] = useState<string | null>(null);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoStop = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recorder = useRecorder();
  const busy = phase !== "idle";

  const ask = async (question: string) => {
    const text = question.trim();
    if (text.length < 2 || phase === "thinking") return;
    setAsked(text);
    setError(null);
    setResult(null);
    setPhase("thinking");
    try {
      setResult(await api<AskResponse>("/api/ask", "POST", { question: text, project_id: projectId ?? null }));
      setQ("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sera couldn't answer that. Try again.");
    } finally {
      setPhase("idle");
    }
  };

  const finishVoice = async () => {
    if (autoStop.current) clearTimeout(autoStop.current);
    const audio = await recorder.stop();
    if (!audio) {
      setPhase("idle");
      return;
    }
    setPhase("transcribing");
    try {
      const form = new FormData();
      form.append("audio", audio.blob, `question.${extFor(audio.mimeType)}`);
      const res = await fetch("/api/ask/transcribe", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      if (!res.ok || !data.text) throw new Error(data.error ?? "Couldn't hear that. Try again or type your question.");
      setQ(data.text);
      setPhase("idle");
      await ask(data.text);
    } catch (e) {
      setPhase("idle");
      toast.error(e instanceof Error ? e.message : "Couldn't hear that.");
    }
  };

  const startVoice = async () => {
    setError(null);
    const ok = await recorder.start();
    if (!ok) {
      toast.error("Couldn't use the microphone. Allow mic access, or type your question.");
      return;
    }
    setPhase("recording");
    autoStop.current = setTimeout(() => void finishVoice(), MAX_QUESTION_SECONDS * 1000);
  };

  const cancelVoice = () => {
    if (autoStop.current) clearTimeout(autoStop.current);
    recorder.cancel();
    setPhase("idle");
  };

  const reset = () => {
    setResult(null);
    setAsked(null);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <section aria-label="Ask Sera" className="surface-raised flex flex-col gap-4 p-3 sm:p-4">
      {phase === "recording" ? (
        <div className="flex items-center gap-3 rounded-2xl bg-[linear-gradient(180deg,#2e2e33_0%,#121214_100%)] py-2 pr-2 pl-4 text-white">
          <span className="relative flex size-2.5 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-flare opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-flare" />
          </span>
          <Waveform analyserRef={recorder.analyserRef} className="h-5 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-sm text-white/80">Listening… ask your question</span>
          <span className="font-mono text-xs text-white/60 tabular-nums">0:{String(recorder.elapsed).padStart(2, "0")}</span>
          <Button type="button" size="icon-sm" variant="ghost" className="text-white hover:bg-white/10" onClick={cancelVoice} aria-label="Cancel">
            <X />
          </Button>
          <Button type="button" size="sm" variant="cream" onClick={() => void finishVoice()}>
            <Square className="size-3.5 fill-current" /> Done
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask(q);
          }}
          className="flex items-center gap-2 rounded-2xl border border-cream-dark bg-paper py-1.5 pr-1.5 pl-4 focus-within:border-ink/25"
        >
          <Sparkles className="size-4 shrink-0 text-ink/50" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={500}
            disabled={busy}
            placeholder={phase === "transcribing" ? "Writing down your question…" : (placeholder ?? "Ask Sera about your clients…")}
            aria-label="Ask Sera a question"
            className="min-w-0 flex-1 bg-transparent py-2 text-[0.95rem] outline-none placeholder:text-ink/45 disabled:opacity-70"
          />
          <Button type="button" size="icon-sm" variant="outline" onClick={() => void startVoice()} disabled={busy} aria-label="Ask by voice" title="Ask by voice">
            {phase === "transcribing" ? <Loader2 className="animate-spin" /> : <Mic />}
          </Button>
          <Button type="submit" size="icon-sm" variant="ink" disabled={busy || q.trim().length < 2} aria-label="Ask">
            {phase === "thinking" ? <Loader2 className="animate-spin" /> : <ArrowUp />}
          </Button>
        </form>
      )}

      {!asked && !busy && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQ(s);
                void ask(s);
              }}
              className="rounded-full border border-cream-dark bg-white px-3 py-1.5 text-left text-xs font-semibold text-ink/75 transition-colors hover:border-ink/25 hover:text-ink"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {asked && (
        <div className="flex flex-col gap-4 border-t border-cream-dark px-1 pt-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-ink-muted">
              <span className="font-semibold text-ink/70">You asked:</span> {asked}
            </p>
            {!busy && (
              <Button type="button" size="icon-xs" variant="ghost" onClick={reset} aria-label="Clear answer">
                <X />
              </Button>
            )}
          </div>

          {phase === "thinking" && (
            <div className="flex flex-col gap-2" aria-live="polite">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink/70">
                <Loader2 className="size-4 animate-spin" /> Going through your calls…
              </p>
              <div className="h-3 w-4/5 animate-pulse rounded bg-cream-dark/70" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-cream-dark/70" />
            </div>
          )}

          {error && <p className="rounded-lg bg-error-bg px-3 py-2 text-sm font-medium text-pulse">{error}</p>}

          {result && <Answer result={result} />}
        </div>
      )}
    </section>
  );
}

const SHOWN_SOURCES = 4;

function Answer({ result }: { result: AskResponse }) {
  const [all, setAll] = useState(false);
  const shown = all ? result.sources : result.sources.slice(0, SHOWN_SOURCES);
  const hidden = result.sources.length - shown.length;
  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-1 duration-300" aria-live="polite">
      <p className={cn("text-[0.975rem] leading-relaxed", !result.found && "text-ink/75")}>{result.answer}</p>
      {result.points.length > 0 && (
        <ul className="flex flex-col gap-1.5 text-sm">
          {result.points.map((p) => (
            <li key={p} className="flex gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ink/35" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}
      {result.draft && <Draft draft={result.draft} />}
      {result.sources.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="eyebrow">From your calls</p>
          <ul className="flex flex-col gap-2">
            {shown.map((s) => (
              <li key={s.key}>
                <SourceItem s={s} />
              </li>
            ))}
          </ul>
          {hidden > 0 && (
            <Button type="button" size="xs" variant="ghost" className="self-start" onClick={() => setAll(true)}>
              Show {hidden} more
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function SourceItem({ s }: { s: AskSource }) {
  const icon =
    s.kind === "task" ? <CheckSquare className="size-4" /> : s.kind === "conversation" ? <MessagesSquare className="size-4" /> : <FolderKanban className="size-4" />;
  return (
    <Link href={s.href} className="group flex items-start gap-3 rounded-xl border border-cream-dark bg-white px-3.5 py-3 transition-colors hover:border-ink/20">
      <span className="min-w-0 flex-1">
        {s.kind === "finding" ? (
          <span className="flex flex-col gap-1.5">
            <span className="flex flex-wrap items-center gap-2">
              <FindingBadge category={s.category} />
              <span className="text-sm font-semibold">{s.title}</span>
            </span>
            <span className="border-l-[3px] border-dawn-strong pl-3 font-serif text-[0.95rem] text-ink/80 italic">“{s.quote}”</span>
          </span>
        ) : (
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-ink/60">{icon}</span>
            <span className={cn(s.kind === "task" && s.done && "line-through opacity-60")}>{s.title}</span>
          </span>
        )}
        <span className="mt-1.5 block text-xs text-ink-muted">{s.meta}</span>
      </span>
      <ArrowRight className="mt-0.5 size-4 shrink-0 text-ink/35 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function Draft({ draft }: { draft: AskDraft }) {
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      toast.success("Draft copied.");
    } catch {
      toast.error("Couldn't copy. Select the text and copy it instead.");
    }
  };
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return (
    <div className="flex flex-col gap-2.5 rounded-xl bg-cream/70 p-3.5">
      <p className="inline-flex items-center gap-2 text-sm font-semibold">
        <Mail className="size-4" /> Draft email to {draft.to}
      </p>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        aria-label="Subject"
        className="rounded-lg border border-cream-dark bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-ink/25"
      />
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} aria-label="Email" className="min-h-48 bg-white text-[0.875rem]" />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={() => void copy()}>
          <Clipboard /> Copy
        </Button>
        <a href={mailto} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-cream-dark bg-white px-3.5 text-sm font-semibold hover:border-ink/25">
          <Mail className="size-4" /> Open in email
        </a>
        <span className="text-xs text-ink-muted">Sera never sends anything. Review it, then send it yourself.</span>
      </div>
    </div>
  );
}
