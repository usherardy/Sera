"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client/api";
import type { ConversationSource } from "@/lib/projects/types";

const MAX_CHARS = 60_000;

function localInputValue(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

interface Created {
  id: string;
  status: "completed" | "failed" | "existing";
  duplicate?: boolean;
  error?: string;
  findings?: number;
}

function AddConversationDialog({ projectId, open, onOpenChange }: { projectId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState(() => localInputValue(new Date()));
  const [transcript, setTranscript] = useState("");
  const [source, setSource] = useState<ConversationSource>("paste");
  const [busy, setBusy] = useState(false);

  const tooLong = transcript.length > MAX_CHARS;
  const valid = title.trim() && transcript.trim() && !tooLong && when;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 500_000) return toast.error("That file is too large for a text transcript.");
    if (!/\.(txt|md|vtt|srt)$/i.test(file.name) && !file.type.startsWith("text/")) return toast.error("Upload a plain text transcript (.txt).");
    setTranscript(await file.text());
    setSource("upload");
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""));
  };

  const submit = async () => {
    setBusy(true);
    try {
      const res = await api<Created>(`/api/projects/${projectId}/conversations`, "POST", {
        title: title.trim(),
        transcript: transcript.trim(),
        source,
        recorded_at: new Date(when).toISOString(),
      });
      if (res.duplicate) toast("That transcript was already added to this project.");
      else if (res.status === "failed") toast.error(res.error ?? "Couldn't analyze. You can retry from the conversation page.");
      else toast.success(res.findings ? `Found ${res.findings} item${res.findings === 1 ? "" : "s"} to look at.` : "Analyzed. Nothing relevant found.");
      onOpenChange(false);
      router.push(`/projects/${projectId}/conversations/${res.id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add the conversation. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <div className="flex flex-col gap-1">
          <DialogTitle className="display text-3xl">
            Add a <em>conversation</em>
          </DialogTitle>
          <DialogDescription className="text-ink-muted">
            Paste a transcript with speaker labels like <span className="font-mono text-ink">Client:</span> and{" "}
            <span className="font-mono text-ink">You:</span>. Labels let Sera tell who asked from who agreed.
          </DialogDescription>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="c-title">Title</Label>
            <Input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kickoff call" autoFocus />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="c-when">When it happened</Label>
            <Input id="c-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="c-text">Transcript</Label>
            <Button variant="outline" size="xs" onClick={() => fileRef.current?.click()} disabled={busy}>
              <FileUp />
              Upload .txt
            </Button>
            <input ref={fileRef} type="file" accept=".txt,.md,.vtt,.srt,text/plain" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
          </div>
          <Textarea
            id="c-text"
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              setSource("paste");
            }}
            placeholder={'Client: Can we also add Stripe payments to the website?\nYou: I can look into it, but I\'ll need to estimate the extra work first.'}
            className="max-h-72 min-h-44 font-mono text-[0.8125rem]"
            aria-invalid={tooLong}
          />
          <p className={`text-xs ${tooLong ? "text-pulse" : "text-ink-muted"}`}>
            {transcript.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
          </p>
        </div>

        <p className="text-xs text-ink-muted">
          Make sure everyone on the call knew it was recorded. Sera flags possible changes for you to review; it doesn&apos;t give legal advice.
        </p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid || busy}>
            {busy && <Loader2 className="animate-spin" />}
            {busy ? "Analyzing…" : "Add and analyze"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AddConversationButton({ projectId, variant = "default", size = "default" }: { projectId: string; variant?: "default" | "outline"; size?: "default" | "sm" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <MessagesSquare />
        Add conversation
      </Button>
      {open && <AddConversationDialog projectId={projectId} open={open} onOpenChange={setOpen} />}
    </>
  );
}
