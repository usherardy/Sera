"use client";

import { useState } from "react";
import { CalendarPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Commitment } from "@/lib/types";

export interface CommitmentEdits {
  title: string;
  owner_label: string | null;
  due_date: string | null;
  due_time: string | null; // "HH:MM" local, only if the user chose one
}

type OwnerMode = "me" | "other" | "unassigned";

function ownerModeOf(owner: string | null): OwnerMode {
  if (!owner) return "unassigned";
  return owner.toLowerCase() === "me" ? "me" : "other";
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  /** "" = nothing chosen yet */
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg border-2 border-cream-dark bg-paper p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
            value === o.value ? "bg-dawn text-ink" : "text-ink/60 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EditCommitmentDialog({
  commitment,
  open,
  onOpenChange,
  requireOwner = false,
  onSave,
}: {
  commitment: Commitment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** set when opened from "Approve" on an unassigned task */
  requireOwner?: boolean;
  onSave: (edits: CommitmentEdits, approve: boolean) => void;
}) {
  const [title, setTitle] = useState(commitment.title);
  const [mode, setMode] = useState<OwnerMode>(ownerModeOf(commitment.owner_label));
  const [name, setName] = useState(mode === "other" ? (commitment.owner_label ?? "") : "");
  const [dueDate, setDueDate] = useState(commitment.due_date ?? "");
  const [dueTime, setDueTime] = useState(commitment.due_at ? commitment.due_at.slice(11, 16) : "");

  const owner = mode === "me" ? "me" : mode === "other" ? name.trim() || null : null;
  const ownerMissing = requireOwner && !owner;
  const isPending = commitment.approval_status === "pending";

  const save = (approve: boolean) =>
    onSave(
      { title: title.trim() || commitment.title, owner_label: owner, due_date: dueDate || null, due_time: dueDate && dueTime ? dueTime : null },
      approve,
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col gap-1">
          <DialogTitle className="display text-3xl">
            {requireOwner ? (
              <>
                Who&apos;s <em>doing</em> this?
              </>
            ) : (
              <>
                Edit <em>task</em>
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-ink-muted">
            {requireOwner
              ? "The recording doesn't say who will do it. Confirm the owner before approving."
              : "Correct anything the AI got wrong."}
          </DialogDescription>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="c-title">Task</Label>
          <Input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Owner</Label>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "me", label: "Me" },
              { value: "other", label: "Someone else" },
              { value: "unassigned", label: "Unassigned" },
            ]}
          />
          {mode === "other" && (
            <Input placeholder="Their name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="c-date">Deadline</Label>
          <div className="grid grid-cols-[1fr_8rem] gap-2">
            <Input id="c-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <Input
              type="time"
              aria-label="Time (optional)"
              value={dueTime}
              disabled={!dueDate}
              onChange={(e) => setDueTime(e.target.value)}
            />
          </div>
          {commitment.due_phrase && (
            <p className="text-xs text-ink-muted">
              Said: <span className="font-serif text-sm italic">“{commitment.due_phrase}”</span>
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {isPending && !requireOwner && (
            <Button variant="outline" onClick={() => save(false)}>
              Save
            </Button>
          )}
          <Button disabled={ownerMissing} onClick={() => save(isPending)}>
            <Check />
            {isPending ? "Save and approve" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export interface SyncChoice {
  allDay: boolean;
  time: string | null; // "HH:MM" local
}

export function SyncCalendarDialog({
  commitment,
  open,
  onOpenChange,
  onConfirm,
  onEditDeadline,
}: {
  commitment: Commitment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (choice: SyncChoice) => void;
  onEditDeadline: () => void;
}) {
  const hasTime = !!commitment.due_at;
  const [allDay, setAllDay] = useState<boolean | null>(hasTime ? false : null);
  const [time, setTime] = useState(hasTime ? commitment.due_at!.slice(11, 16) : "");
  const ready = !!commitment.due_date && (hasTime || allDay === true || (allDay === false && !!time));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col gap-1">
          <DialogTitle className="display text-3xl">
            Add to <em>calendar</em>
          </DialogTitle>
          <DialogDescription className="text-ink-muted">
            Nothing is added to Google Calendar until you confirm.
          </DialogDescription>
        </div>

        <div className="rounded-card border-2 border-cream-dark bg-paper p-4">
          <p className="font-semibold">{commitment.title}</p>
          <p className="mt-1 font-mono text-xs text-ink-muted">
            {commitment.due_date ? formatDateOnly(commitment.due_date) : "No deadline yet"}
          </p>
        </div>

        {!commitment.due_date ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">This task has no deadline. Add one before scheduling it.</p>
            <Button variant="outline" onClick={onEditDeadline}>
              Add a deadline
            </Button>
          </div>
        ) : hasTime ? null : (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              No time was mentioned{commitment.due_phrase ? ` (“${commitment.due_phrase}”)` : ""}. Choose one, or make it an
              all-day event.
            </p>
            <Segmented
              value={allDay === null ? "" : allDay ? "allday" : "time"}
              onChange={(v) => setAllDay(v === "allday")}
              options={[
                { value: "allday", label: "All-day" },
                { value: "time", label: "Pick a time" },
              ]}
            />
            {allDay === false && (
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Event time" autoFocus />
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!ready} onClick={() => onConfirm({ allDay: !!allDay && !hasTime, time: hasTime ? time : allDay ? null : time })}>
            <CalendarPlus />
            Add to Google Calendar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
