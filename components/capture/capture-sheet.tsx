"use client";

import { useRef, useState, type ReactNode } from "react";
import { FileAudio, Loader2, Mic, MessagesSquare, NotebookPen, ShieldCheck, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { RecordingKind } from "@/lib/types";
import { useCapture } from "./capture-provider";
import { probeDuration, validateAudioFile } from "./ingest";

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function KindOption({
  active,
  onClick,
  icon,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-1 flex-col items-start gap-2 rounded-card border-2 p-4 text-left transition-colors",
        active ? "border-ink bg-dawn" : "border-cream-dark bg-paper hover:border-ink/40",
      )}
    >
      <span className="[&_svg]:size-5">{icon}</span>
      <span className="font-semibold">{title}</span>
      <span className="text-xs text-ink-muted">{body}</span>
    </button>
  );
}

function CaptureBody() {
  const { startRecording, submit, recorderError, closeSheet } = useCapture();
  const [kind, setKind] = useState<RecordingKind>("conversation");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [recordedAt, setRecordedAt] = useState<string>("");
  const [starting, setStarting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = (f: File | undefined) => {
    if (!f) return;
    const err = validateAudioFile(f);
    setFileError(err);
    setFile(err ? null : f);
    setRecordedAt(toLocalInputValue(new Date(f.lastModified || Date.now())));
  };

  const onUpload = async () => {
    if (!file) return;
    const duration = await probeDuration(file);
    await submit({
      file,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      kind,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(file.lastModified),
      durationSeconds: duration,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-3">
        <KindOption
          active={kind === "conversation"}
          onClick={() => setKind("conversation")}
          icon={<MessagesSquare />}
          title="Conversation"
          body="A meeting or chat with other people"
        />
        <KindOption
          active={kind === "voice_note"}
          onClick={() => setKind("voice_note")}
          icon={<NotebookPen />}
          title="Voice note"
          body="Just you, thinking out loud"
        />
      </div>

      <div className="flex gap-3 rounded-card bg-warning p-4 text-sm text-warning-dark">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <p>
          Only record people who know and agree to it. Consent laws differ by country. Audio is stored
          privately and you can delete it at any time.
        </p>
      </div>

      {file ? (
        <div className="flex flex-col gap-4 rounded-card border-2 border-cream-dark bg-paper p-4">
          <div className="flex items-center gap-3">
            <FileAudio className="size-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{file.name}</p>
              <p className="font-mono text-xs text-ink-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => setFile(null)} aria-label="Remove file">
              <X />
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="recorded-at">When was this recorded?</Label>
            <Input
              id="recorded-at"
              type="datetime-local"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
            />
          </div>
          <Button size="lg" onClick={onUpload}>
            <Upload />
            Upload and process
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="ink"
            size="lg"
            className="sm:flex-1"
            disabled={starting}
            onClick={async () => {
              setStarting(true);
              await startRecording(kind);
              setStarting(false);
            }}
          >
            {starting ? <Loader2 className="animate-spin" /> : <Mic />}
            Start recording
          </Button>
          <Button variant="outline" size="lg" className="sm:flex-1" onClick={() => inputRef.current?.click()}>
            <Upload />
            Upload audio
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,.m4a,.mp3,.wav,.webm,.ogg,.flac"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
        </div>
      )}

      {(fileError || recorderError) && (
        <p className="rounded-lg bg-error-bg px-3 py-2 text-sm font-medium text-pulse">{fileError ?? recorderError}</p>
      )}

      <p className="text-center text-xs text-ink-muted">
        Up to about 15 minutes per recording.{" "}
        <button className="underline" onClick={closeSheet}>
          Not now
        </button>
      </p>
    </div>
  );
}

export function CaptureSheet() {
  const { sheetOpen, openSheet, closeSheet } = useCapture();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const onOpenChange = (open: boolean) => (open ? openSheet() : closeSheet());
  const title = (
    <>
      Capture a <em>moment</em>
    </>
  );
  const description = "Record live, or upload audio from your phone.";

  if (isDesktop) {
    return (
      <Dialog open={sheetOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex flex-col gap-1">
            <DialogTitle className="display text-4xl">{title}</DialogTitle>
            <DialogDescription className="text-ink-muted">{description}</DialogDescription>
          </div>
          <CaptureBody />
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Sheet open={sheetOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="overflow-y-auto px-5 pt-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <div className="mx-auto mb-1 h-1.5 w-10 rounded-full bg-cream-dark" />
        <div className="flex flex-col gap-1">
          <SheetTitle className="display text-4xl">{title}</SheetTitle>
          <SheetDescription className="text-ink-muted">{description}</SheetDescription>
        </div>
        <CaptureBody />
      </SheetContent>
    </Sheet>
  );
}
