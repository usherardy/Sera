"use client";

import { useState } from "react";
import { CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/layout-bits";
import { cn } from "@/lib/utils";
import { CommitmentCard, type C } from "./commitment-card";
import { EditCommitmentDialog, SyncCalendarDialog, type CommitmentEdits, type SyncChoice } from "./commitment-dialogs";

type Bucket = "review" | "upcoming" | "completed";

function bucketOf(c: C): Bucket | null {
  if (c.approval_status === "dismissed") return null;
  if (c.approval_status === "pending") return "review";
  return c.completion_status === "done" ? "completed" : "upcoming";
}

/**
 * Commitment review UI. In the design preview, changes live in local state.
 * Phase 4 wires each handler to PATCH /api/commitments/[id] and
 * POST /api/commitments/[id]/sync-calendar.
 */
export function ActionsBoard({
  commitments: initial,
  tz,
  mode = "full",
  limit,
}: {
  commitments: C[];
  tz: string;
  mode?: "full" | "preview";
  limit?: number;
}) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<{ id: string; requireOwner: boolean } | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [tab, setTab] = useState<Bucket>("review");

  const patch = (id: string, p: Partial<C>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const approve = (c: C) => {
    if (!c.owner_label) {
      setEditing({ id: c.id, requireOwner: true });
      return;
    }
    patch(c.id, { approval_status: "approved" });
    toast.success("Approved. It's in Upcoming.");
  };

  const dismiss = (c: C) => {
    patch(c.id, { approval_status: "dismissed" });
    toast("Task dismissed", { action: { label: "Undo", onClick: () => patch(c.id, { approval_status: "pending" }) } });
  };

  const toggleComplete = (c: C) =>
    patch(c.id, { completion_status: c.completion_status === "done" ? "open" : "done" });

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

  const confirmSync = (c: C, choice: SyncChoice) => {
    patch(c.id, {
      all_day: choice.allDay,
      due_at: choice.time && c.due_date ? `${c.due_date}T${choice.time}:00` : c.due_at,
      external_event_id: "preview-event",
    });
    setSyncing(null);
    toast.success("Added to Google Calendar (preview).");
  };

  const cardFor = (c: C, compact = false) => (
    <CommitmentCard
      key={c.id}
      commitment={c}
      tz={tz}
      compact={compact}
      onApprove={() => approve(c)}
      onDismiss={() => dismiss(c)}
      onEdit={() => setEditing({ id: c.id, requireOwner: false })}
      onToggleComplete={() => toggleComplete(c)}
      onSync={() => setSyncing(c.id)}
    />
  );

  const by = (b: Bucket) => items.filter((c) => bucketOf(c) === b);
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
          onConfirm={(choice) => confirmSync(syncingItem, choice)}
          onEditDeadline={() => {
            setSyncing(null);
            setEditing({ id: syncingItem.id, requireOwner: false });
          }}
        />
      )}
    </>
  );

  if (mode === "preview") {
    const open = [...by("review"), ...by("upcoming")].slice(0, limit ?? 3);
    return (
      <>
        {open.length === 0 ? (
          <EmptyState icon={<CheckSquare />} title="No commitments found in your recordings." />
        ) : (
          <div className="flex flex-col gap-3">{open.map((c) => cardFor(c, true))}</div>
        )}
        {dialogs}
      </>
    );
  }

  const tabs: { value: Bucket; label: string; empty: string }[] = [
    { value: "review", label: "Needs review", empty: "Nothing to review. New commitments from your recordings land here." },
    { value: "upcoming", label: "Upcoming", empty: "Approved tasks you haven't finished will show here." },
    { value: "completed", label: "Completed", empty: "Tasks you mark complete will show here." },
  ];

  return (
    <>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Bucket)} className="gap-5">
        <TabsList className="h-auto w-full gap-1 rounded-xl border-2 border-cream-dark bg-paper p-1 sm:w-fit">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className={cn(
                "h-10 flex-1 rounded-lg px-3 text-sm font-semibold sm:flex-none sm:px-4",
                "data-active:bg-dawn data-active:text-ink data-active:shadow-none",
              )}
            >
              {t.label}
              <span className="font-mono text-xs text-ink-muted">{by(t.value).length}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            {by(t.value).length === 0 ? (
              <EmptyState icon={<CheckSquare />} title={t.value === "review" ? "All caught up." : "Nothing here yet."} body={t.empty} />
            ) : (
              <div className="flex flex-col gap-3">{by(t.value).map((c) => cardFor(c))}</div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      {dialogs}
    </>
  );
}
