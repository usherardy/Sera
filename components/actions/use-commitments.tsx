"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/client/api";
import { isWaitingOn } from "@/lib/ledger";
import { DESIGN_PREVIEW } from "@/lib/preview";
import type { C } from "./commitment-card";
import { EditCommitmentDialog, SyncCalendarDialog, type CommitmentEdits, type SyncChoice } from "./commitment-dialogs";

/**
 * Shared commitment state + review actions for Actions and Close your day.
 * Changes show instantly (optimistic) and are saved with PATCH /api/commitments/[id];
 * a failed save rolls back. In the design preview they stay in local state.
 * Calendar sync (POST /api/commitments/[id]/sync-calendar) arrives in Phase 4.
 */
export function useCommitments(initial: C[]) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<{ id: string; requireOwner: boolean } | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const setLocal = (id: string, p: Partial<C>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  /** Optimistic update + save. `p` must only contain saveable fields. */
  const patch = (id: string, p: Partial<C>) => {
    const before = items.find((x) => x.id === id);
    setLocal(id, p);
    if (DESIGN_PREVIEW || !before) return;
    const { recording: _r, ...saveable } = p as C;
    void _r;
    api(`/api/commitments/${id}`, "PATCH", saveable).catch((e: Error) => {
      const revert = Object.fromEntries(Object.keys(p).map((k) => [k, before[k as keyof C]])) as Partial<C>;
      setLocal(id, revert);
      toast.error(e.message || "Couldn't save. Try again.");
    });
  };

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
      due_time: e.due_date && e.due_time ? e.due_time : null,
      ...(andApprove ? { approval_status: "approved" as const } : {}),
    });
    setEditing(null);
    toast.success(andApprove ? "Saved and approved." : "Saved.");
  };

  const schedule = (c: C, choice: SyncChoice, opts: { quiet?: boolean } = {}) => {
    if (!DESIGN_PREVIEW) {
      setSyncing(null);
      if (!opts.quiet) toast("Google Calendar sync is the next thing we're wiring up. Your approval is saved.");
      return;
    }
    setLocal(c.id, {
      all_day: choice.allDay,
      due_time: choice.time ?? c.due_time,
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
