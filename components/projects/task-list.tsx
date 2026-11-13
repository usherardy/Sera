"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client/api";
import { formatDateOnly } from "@/lib/format";
import type { Task } from "@/lib/projects/types";
import { CalendarLink } from "./calendar-link";
import { cn } from "@/lib/utils";

/** Open follow-up tasks with a complete toggle. */
export function TaskList({ tasks, projectName }: { tasks: Task[]; projectName?: string }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggle = async (t: Task) => {
    setBusyId(t.id);
    try {
      await api(`/api/tasks/${t.id}`, "PATCH", { status: t.status === "done" ? "open" : "done" });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update the task.");
    } finally {
      setBusyId(null);
    }
  };

  if (tasks.length === 0) return <p className="text-sm text-ink-muted">No follow-ups yet.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-start gap-3 text-sm">
          <button
            type="button"
            aria-label={t.status === "done" ? "Mark as open" : "Mark as done"}
            disabled={busyId === t.id}
            onClick={() => toggle(t)}
            className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-ink/30 disabled:opacity-50", t.status === "done" && "bg-fathom text-cream")}
          >
            {t.status === "done" && <Check className="size-3.5" />}
          </button>
          <span className="min-w-0">
            <span className={cn("block font-semibold", t.status === "done" && "line-through opacity-60")}>{t.title}</span>
            <span className="block text-xs text-ink-muted">
              {t.owner ?? "Unassigned"} · {t.due_date ? formatDateOnly(t.due_date) : "No due date"}
            </span>
            {t.status === "open" && <CalendarLink title={t.title} date={t.due_date} details={projectName ? `Follow-up for ${projectName} (from SERA)` : "Follow-up from SERA"} className="-ml-1.5" />}
          </span>
        </li>
      ))}
    </ul>
  );
}
