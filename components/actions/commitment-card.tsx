"use client";

import Link from "next/link";
import { BellRing, CalendarCheck2, CalendarPlus, Check, Pencil, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfidenceMeter, DueChip, OwnerChip, SampleBadge } from "@/components/common/badges";
import { PlayClip } from "@/components/common/play-clip";
import { isWaitingOn } from "@/lib/ledger";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Commitment, WithSource } from "@/lib/types";

export type C = Commitment & WithSource;

export function CommitmentCard({
  commitment: c,
  tz,
  onApprove,
  onDismiss,
  onEdit,
  onToggleComplete,
  onSync,
  compact = false,
}: {
  commitment: C;
  tz: string;
  onApprove: () => void;
  onDismiss: () => void;
  onEdit: () => void;
  onToggleComplete: () => void;
  onSync: () => void;
  compact?: boolean;
}) {
  const pending = c.approval_status === "pending";
  const done = c.completion_status === "done";
  const synced = !!c.external_event_id;
  const waitingOn = isWaitingOn(c.owner_label);

  return (
    <article className={cn("surface flex flex-col gap-4 p-4 sm:p-5", done && "opacity-70")}>
      <div className="flex items-start gap-3">
        {!pending && (
          <button
            onClick={onToggleComplete}
            aria-label={done ? "Mark as not done" : "Mark complete"}
            className={cn(
              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
              done ? "border-ink bg-ink text-cream" : "border-ink/40 hover:border-ink",
            )}
          >
            {done && <Check className="size-3.5" />}
          </button>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className={cn("text-lg leading-snug font-semibold", done && "line-through")}>{c.title}</h3>
            {c.is_sample && <SampleBadge className="mt-1 shrink-0" />}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OwnerChip owner={c.owner_label} />
            <DueChip dueDate={c.due_date} duePhrase={c.due_phrase} />
            {synced && (
              <span className="inline-flex items-center gap-1 rounded-md bg-success px-2 py-1 text-xs font-semibold text-success-dark">
                <CalendarCheck2 className="size-3.5" />
                {waitingOn ? "Check-in scheduled" : "In calendar"}
              </span>
            )}
            {!compact && <ConfidenceMeter confidence={c.confidence} />}
          </div>
          {!compact && (
            <p className="font-serif text-[1.05rem] leading-snug text-ink/80 italic">“{c.evidence_text}”</p>
          )}
          <div className="flex min-w-0 items-center gap-3">
            {!compact && (
              <PlayClip recordingId={c.recording_id} startMs={c.start_ms} endMs={c.end_ms} available={!c.is_sample} className="shrink-0" />
            )}
            <Link
              href={`/memory/${c.recording_id}${c.start_ms != null ? `?t=${c.start_ms}` : ""}#transcript`}
              className="eyebrow min-w-0 truncate hover:text-ink"
            >
              From {c.recording.title} · {formatClock(c.recording.recorded_at, tz)}
            </Link>
          </div>
        </div>
      </div>

      {pending && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onApprove}>
            <Check />
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil />
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            <X />
            Dismiss
          </Button>
        </div>
      )}
      {!pending && !done && !compact && (
        <div className="flex flex-wrap gap-2">
          {!synced && (
            <Button size="sm" variant="outline" onClick={onSync}>
              {waitingOn ? <BellRing /> : <CalendarPlus />}
              {waitingOn ? "Remind me to check in" : "Sync to Google Calendar"}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Pencil />
            Edit
          </Button>
        </div>
      )}
      {done && !compact && (
        <div>
          <Button size="sm" variant="ghost" onClick={onToggleComplete}>
            <RotateCcw />
            Undo
          </Button>
        </div>
      )}
    </article>
  );
}
