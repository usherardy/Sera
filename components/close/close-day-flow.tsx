"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarPlus, Check, Hourglass, Moon, Pencil, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CategoryBadge, DueChip, OwnerChip, SampleBadge } from "@/components/common/badges";
import { EvidenceQuote } from "@/components/common/layout-bits";
import { PlayClip } from "@/components/common/play-clip";
import type { C } from "@/components/actions/commitment-card";
import { useCommitments } from "@/components/actions/use-commitments";
import { formatDateOnly, formatMomentClock } from "@/lib/format";
import { calendarEventTitle, isWaitingOn, splitLedger } from "@/lib/ledger";
import { api } from "@/lib/client/api";
import { DESIGN_PREVIEW } from "@/lib/preview";
import { cn } from "@/lib/utils";
import type { Moment, WithSource } from "@/lib/types";

type M = Moment & WithSource;
type Step = { kind: "commitment"; id: string } | { kind: "moment"; id: string };

/**
 * Close your day: a short evening review. Each pending promise is approved,
 * fixed or dismissed; the day's top moments are kept or dismissed. It ends on
 * a summary and one confirmed step that schedules approved items in Calendar.
 */
export function CloseDayFlow({
  commitments,
  moments: initialMoments,
  tz,
}: {
  commitments: C[];
  moments: M[];
  tz: string;
}) {
  const store = useCommitments(commitments);
  const [moments, setMoments] = useState(initialMoments);
  const [momentChoice, setMomentChoice] = useState<Record<string, "kept" | "dismissed">>({});
  const [later, setLater] = useState<Set<string>>(new Set());

  // Fixed at mount: the promises that needed review when the ritual started.
  const [steps] = useState<Step[]>(() => [
    ...commitments.filter((c) => c.approval_status === "pending").map((c) => ({ kind: "commitment" as const, id: c.id })),
    ...initialMoments.map((m) => ({ kind: "moment" as const, id: m.id })),
  ]);

  const isResolved = (s: Step) =>
    s.kind === "moment"
      ? !!momentChoice[s.id]
      : later.has(s.id) || store.items.find((c) => c.id === s.id)?.approval_status !== "pending";

  const doneCount = steps.filter(isResolved).length;
  const current = steps.find((s) => !isResolved(s)) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="eyebrow">Close your day</p>
          <div className="flex gap-1" aria-label={`${doneCount} of ${steps.length} reviewed`}>
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={cn(
                  "h-1.5 w-6 rounded-full transition-colors duration-300",
                  i < doneCount ? "bg-ink" : s === current ? "bg-purple" : "bg-cream-dark",
                )}
              />
            ))}
          </div>
        </div>
        <Link href="/" aria-label="Leave" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
          <X />
        </Link>
      </div>

      {current?.kind === "commitment" ? (
        <PromiseStep
          key={current.id}
          c={store.items.find((c) => c.id === current.id)!}
          tz={tz}
          index={doneCount + 1}
          total={steps.length}
          onApprove={(c) => store.approve(c, { quiet: true })}
          onFix={(c) => store.edit(c)}
          onDismiss={(c) => store.dismiss(c, { quiet: true })}
          onLater={(c) => setLater((s) => new Set(s).add(c.id))}
        />
      ) : current?.kind === "moment" ? (
        <MomentStep
          key={current.id}
          m={moments.find((m) => m.id === current.id)!}
          tz={tz}
          index={doneCount + 1}
          total={steps.length}
          onKeep={(m) => setMomentChoice((x) => ({ ...x, [m.id]: "kept" }))}
          onDismiss={(m) => {
            setMoments((ms) => ms.map((x) => (x.id === m.id ? { ...x, dismissed: true } : x)));
            setMomentChoice((x) => ({ ...x, [m.id]: "dismissed" }));
            if (!DESIGN_PREVIEW)
              api(`/api/moments/${m.id}`, "PATCH", { dismissed: true }).catch(() => toast.error("Couldn't save that. Try again."));
          }}
        />
      ) : (
        <DayClosed
          items={store.items}
          keptMoments={moments.filter((m) => momentChoice[m.id] === "kept").length}
          decideLater={later.size}
          nothingToReview={steps.length === 0}
          onSchedule={(cs) => {
            if (!DESIGN_PREVIEW) {
              toast("Google Calendar sync is the next thing we're wiring up. Your approvals are saved.");
              return;
            }
            cs.forEach((c) => store.schedule(c, { allDay: !c.due_time, time: c.due_time }, { quiet: true }));
            toast.success(`Added ${cs.length} event${cs.length === 1 ? "" : "s"} to Google Calendar (preview).`);
          }}
        />
      )}
      {store.dialogs}
    </div>
  );
}

function StepShell({ children }: { children: React.ReactNode }) {
  return (
    <article className="surface-raised flex flex-col gap-6 p-6 animate-in fade-in slide-in-from-right-6 duration-300 sm:p-8">
      {children}
    </article>
  );
}

function PromiseStep({
  c,
  tz,
  index,
  total,
  onApprove,
  onFix,
  onDismiss,
  onLater,
}: {
  c: C;
  tz: string;
  index: number;
  total: number;
  onApprove: (c: C) => void;
  onFix: (c: C) => void;
  onDismiss: (c: C) => void;
  onLater: (c: C) => void;
}) {
  const theirs = isWaitingOn(c.owner_label);
  const time = formatMomentClock(c.recording.recorded_at, c.start_ms, tz);
  return (
    <StepShell>
      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow">
          {theirs ? `${c.owner_label} promised you` : c.owner_label ? "You promised" : "Someone promised"} · {index} of {total}
        </span>
        {c.is_sample && <SampleBadge className="ml-auto" />}
      </div>
      <h2 className="display text-4xl sm:text-5xl">{c.title}</h2>
      <div className="flex flex-wrap gap-2">
        <OwnerChip owner={c.owner_label} />
        <DueChip dueDate={c.due_date} duePhrase={c.due_phrase} />
      </div>
      <EvidenceQuote meta={<>{c.recording.title}{time ? ` · ${time}` : ""}</>}>{c.evidence_text}</EvidenceQuote>
      {!c.owner_label && (
        <p className="rounded-lg bg-warning px-3 py-2 text-sm text-warning-dark">
          The recording doesn&apos;t say who will do this. Approving asks you to confirm the owner.
        </p>
      )}
      <PlayClip recordingId={c.recording_id} startMs={c.start_ms} endMs={c.end_ms} available={!c.is_sample} className="w-fit" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button size="lg" className="sm:flex-1" onClick={() => onApprove(c)}>
          <Check />
          {theirs ? "Track it" : "Approve"}
        </Button>
        <Button size="lg" variant="outline" className="sm:flex-1" onClick={() => onFix(c)}>
          <Pencil />
          Fix
        </Button>
        <Button size="lg" variant="ghost" onClick={() => onDismiss(c)}>
          <X />
          Not a promise
        </Button>
      </div>
      <button onClick={() => onLater(c)} className="w-fit text-sm text-ink-muted underline underline-offset-4 hover:text-ink">
        Decide later
      </button>
    </StepShell>
  );
}

function MomentStep({
  m,
  tz,
  index,
  total,
  onKeep,
  onDismiss,
}: {
  m: M;
  tz: string;
  index: number;
  total: number;
  onKeep: (m: M) => void;
  onDismiss: (m: M) => void;
}) {
  const time = formatMomentClock(m.recording.recorded_at, m.start_ms, tz);
  return (
    <StepShell>
      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow">
          Worth remembering? · {index} of {total}
        </span>
        {m.is_sample && <SampleBadge className="ml-auto" />}
      </div>
      <div className="flex flex-col gap-3">
        <CategoryBadge category={m.category} className="w-fit" />
        <h2 className="display text-4xl sm:text-5xl">{m.title}</h2>
        <p className="text-base text-ink/80">{m.summary}</p>
      </div>
      <EvidenceQuote meta={<>{m.recording.title}{time ? ` · ${time}` : ""}</>}>{m.evidence_text}</EvidenceQuote>
      <PlayClip recordingId={m.recording_id} startMs={m.start_ms} endMs={m.end_ms} available={!m.is_sample} className="w-fit" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button size="lg" className="sm:flex-1" onClick={() => onKeep(m)}>
          <Check />
          Keep
        </Button>
        <Button size="lg" variant="ghost" className="sm:flex-1" onClick={() => onDismiss(m)}>
          <X />
          Not important
        </Button>
      </div>
    </StepShell>
  );
}

function DayClosed({
  items,
  keptMoments,
  decideLater,
  nothingToReview,
  onSchedule,
}: {
  items: C[];
  keptMoments: number;
  decideLater: number;
  nothingToReview: boolean;
  onSchedule: (cs: C[]) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const open = items.filter((c) => c.approval_status === "approved" && c.completion_status === "open");
  const { yours, waitingOn } = splitLedger(open);
  const toSchedule = useMemo(() => open.filter((c) => c.due_date && !c.external_event_id), [open]);
  const next = [...open].filter((c) => c.due_date).sort((a, b) => a.due_date!.localeCompare(b.due_date!))[0];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <section className="relative overflow-hidden rounded-3xl bg-ink p-7 text-cream sm:p-9">
        <div className="pointer-events-none absolute -top-20 -right-16 size-60 rounded-full bg-dawn/20 blur-3xl" />
        <div className="relative flex flex-col gap-4">
          <Moon className="size-7 text-dawn" />
          <h2 className="display text-5xl sm:text-6xl">
            Day <em>closed</em>.
          </h2>
          <p className="text-cream/80">
            {nothingToReview
              ? "Nothing needed you today."
              : [
                  `${yours.length} promise${yours.length === 1 ? "" : "s"} on your list`,
                  waitingOn.length ? `${waitingOn.length} you're waiting on` : null,
                  keptMoments ? `${keptMoments} moment${keptMoments === 1 ? "" : "s"} kept` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
          </p>
          {next && (
            <p className="border-t border-cream/15 pt-4 text-sm text-cream/80">
              <span className="font-mono text-xs tracking-wider text-cream/60 uppercase">Next up · </span>
              {calendarEventTitle(next)}, {formatDateOnly(next.due_date!)}
            </p>
          )}
        </div>
      </section>

      {yours.length > 0 && (
        <SummaryList icon={<UserRound />} title="You promised" items={yours} />
      )}
      {waitingOn.length > 0 && (
        <SummaryList icon={<Hourglass />} title="Waiting on others" items={waitingOn} />
      )}
      {decideLater > 0 && (
        <p className="text-sm text-ink-muted">
          {decideLater} left for later.{" "}
          <Link href="/actions" className="font-semibold text-ink underline underline-offset-4">
            Review in Actions
          </Link>
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {toSchedule.length > 0 && (
          <Button size="lg" className="sm:flex-1" onClick={() => setConfirming(true)}>
            <CalendarPlus />
            Add {toSchedule.length} to Google Calendar
          </Button>
        )}
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "sm:flex-1")}>
          Back to Home
          <ArrowRight />
        </Link>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col gap-1">
            <DialogTitle className="display text-3xl">
              Add to <em>calendar</em>
            </DialogTitle>
            <DialogDescription className="text-ink-muted">
              These events will be created in Google Calendar. Where no time was said, they&apos;re all-day. To pick a time,
              schedule that task from Actions instead.
            </DialogDescription>
          </div>
          <ul className="flex flex-col divide-y-2 divide-cream-dark rounded-card border-2 border-cream-dark bg-paper">
            {toSchedule.map((c) => (
              <li key={c.id} className="flex flex-col gap-0.5 px-4 py-3">
                <span className="text-sm font-semibold">{calendarEventTitle(c)}</span>
                <span className="font-mono text-xs text-ink-muted">
                  {formatDateOnly(c.due_date!)} · {c.due_time ?? "all-day"}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onSchedule(toSchedule);
                setConfirming(false);
              }}
            >
              <CalendarPlus />
              Add {toSchedule.length} event{toSchedule.length === 1 ? "" : "s"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryList({ icon, title, items }: { icon: React.ReactNode; title: string; items: C[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold [&_svg]:size-4">
        {icon}
        {title}
      </h3>
      <ul className="surface flex flex-col divide-y-2 divide-cream-dark/70">
        {items.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="min-w-0 text-[0.9375rem]">
              {isWaitingOn(c.owner_label) && <span className="font-semibold">{c.owner_label}: </span>}
              {c.title}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {c.external_event_id && <Check className="size-4 text-success-dark" aria-label="In calendar" />}
              <DueChip dueDate={c.due_date} duePhrase={c.due_phrase} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
