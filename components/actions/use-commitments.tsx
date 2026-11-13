"use client";

import { useState } from "react";
import { toast } from "sonner";
import { isWaitingOn } from "@/lib/ledger";
import type { C } from "./commitment-card";
import { EditCommitmentDialog, SyncCalendarDialog, type CommitmentEdits, type SyncChoice } from "./commitment-dialogs";

/**
 * Shared commitment state + review actions for Actions and Close your day.
 * DESIGN PREVIEW: changes live in local state. Phase 3/4 wire these to
 * PATCH /api/commitments/[id] and POST /api/commitments/[id]/sync-calendar.
 */
export function useCommitments(initial: C[]) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<{ id: string; requireOwner: boolean } | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const patch = (id: string, p: Partial<C>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  /** Returns false when the owner must be confirmed first (dialog opens instead). */
  const approve = (c: C, opts: { quiet?: boolean } = {}) => {
    if (!c.owner_label) {
      setEditing({ id: c.id, requireOwner: true });
      return false;
    }
    patch(c.id, { approval_status: "approved" });
    if (!opts.quiet) toast.success(isWaitingOn(c.owner_label) ? `Approved. Waiting on ${c.owner_label}.` : "Approved. It's in Upcoming.");
    return true;
  };

  const dismiss = (c: C, opts: { quiet?: boolean } = {}) => {
    const prev = c.approval_status;
    patch(c.id, { approval_status: "dismissed" });
    if (!opts.quiet)
      toast("Task dismissed", { action: { label: "Undo", onClick: () => patch(c.id, { approval_status: prev }) } });
  };

  const toggleComplete = (c: C) => patch(c.id, { completion_status: c.completion_status === "done" ? "open" : "done" });

  const saveEdits = (c: C, e: CommitmentEdits, andApprove: boolean) => {
    patch(c.id, {
      title: e.title,
      owner_label: e.owner_label,
      due_date: e.due_date,
      due_at: e.due_date && e.due_time ? `${e.due_date}T${e.due_time}:00` : null,
      ...(andApprove ? { approval_status: "approved" as const } : {}),
    });
    setEditing(null);
    toast.success(andApprove ? "Saved and approved." : "Saved.");
  };

  const schedule = (c: C, choice: SyncChoice, opts: { quiet?: boolean } = {}) => {
    patch(c.id, {
      all_day: choice.allDay,
      due_at: choice.time && c.due_date ? `${c.due_date}T${choice.time}:00` : c.due_at,
      external_event_id: "preview-event",
    });
    setSyncing(null);
    if (!opts.quiet)
      toast.success(isWaitingOn(c.owner_label) ? "Check-in added to Google Calendar (preview)." : "Added to Google Calendar (preview).");
  };

  const editingItem = editing ? items.find((c) => c.id === editing.id) : null;
  const syncingItem = syncing ? items.find((c) => c.id === syncing) : null;

  const dialogs = (
    <>
      {editingItem && (
        <EditCommitmentDialog
          key={`${editingItem.id}-${editing!.requireOwner}`}
          commitment={editingItem}
          open
          requireOwner={editing!.requireOwner}
          onOpenChange={(o) => !o && setEditing(null)}
          onSave={(e, a) => saveEdits(editingItem, e, a)}
        />
      )}
      {syncingItem && (
        <SyncCalendarDialog
          key={syncingItem.id}
          commitment={syncingItem}
          open
          onOpenChange={(o) => !o && setSyncing(null)}
          onConfirm={(choice) => schedule(syncingItem, choice)}
          onEditDeadline={() => {
            setSyncing(null);
            setEditing({ id: syncingItem.id, requireOwner: false });
          }}
        />
      )}
    </>
  );

  return {
    items,
    patch,
    approve,
    dismiss,
    toggleComplete,
    schedule,
    edit: (c: C) => setEditing({ id: c.id, requireOwner: false }),
    openSync: (c: C) => setSyncing(c.id),
    dialogs,
  };
}
