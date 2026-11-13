"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client/api";
import { addDays } from "@/lib/dates";
import { formatDateOnly } from "@/lib/format";
import type { TodoTask } from "@/lib/projects/data";
import { cn } from "@/lib/utils";
import { CalendarLink } from "./calendar-link";

type Group = "Overdue" | "Today" | "This week" | "Later" | "No date";

function groupOf(due: string | null, today: string): Group {
  if (!due) return "No date";
  if (due < today) return "Overdue";
  if (due === today) return "Today";
  if (due <= addDays(today, 7)) return "This week";
  return "Later";
}

function TaskRow({ t, busy, onToggle }: { t: TodoTask; busy: boolean; onToggle: () => void }) {
  const href = t.finding ? `/projects/${t.project.id}/conversations/${t.finding.conversation_id}?finding=${t.finding_id}` : `/projects/${t.project.id}`;
  return (
    <li className="flex items-start gap-3 px-4 py-3.5">
      <button
        type="button"
        aria-label={t.status === "done" ? "Mark as open" : "Mark as done"}
        disabled={busy}
        onClick={onToggle}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-ink/30 disabled:opacity-50",
          t.status === "done" && "bg-fathom text-cream",
        )}
      >
        {t.status === "done" && <Check className="size-3.5" />}
      </button>
      <div className="min-w-0 flex-1">
        <Link href={href} className={cn("font-semibold hover:underline", t.status === "done" && "line-through opacity-60")}>
          {t.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
          <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-ink/75">{t.project.name}</span>
          <span>{t.due_date ? formatDateOnly(t.due_date) : "No due date"}</span>
          {t.auto_created && <span className="rounded-full bg-dawn px-1.5 py-0.5 font-semibold text-ink/70">from call</span>}
          {t.status === "open" && <CalendarLink title={t.title} date={t.due_date} details={`Follow-up for ${t.project.name} (from Sera)`} className="-my-1" />}
        </div>
      </div>
    </li>
  );
}

/** Open tasks across all clients, grouped by when they're due. `limit` shows a short preview without groups. */
export function TodoList({ tasks, today, limit }: { tasks: TodoTask[]; today: string; limit?: number }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  const toggle = async (t: TodoTask) => {
    setBusyId(t.id);
    try {
      await api(`/api/tasks/${t.id}`, "PATCH", { status: done.has(t.id) ? "open" : "done" });
      setDone((prev) => {
        const next = new Set(prev);
        if (next.has(t.id)) next.delete(t.id);
        else next.add(t.id);
        return next;
      });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update the task.");
    } finally {
      setBusyId(null);
    }
  };

  const view = tasks.map((t) => (done.has(t.id) ? { ...t, status: "done" as const } : t));

  if (limit) {
    return (
      <ul className="surface divide-y divide-cream-dark">
        {view.slice(0, limit).map((t) => (
          <TaskRow key={t.id} t={t} busy={busyId === t.id} onToggle={() => void toggle(t)} />
        ))}
      </ul>
    );
  }

  const order: Group[] = ["Overdue", "Today", "This week", "Later", "No date"];
  return (
    <div className="flex flex-col gap-5">
      {order.map((g) => {
        const items = view.filter((t) => groupOf(t.due_date, today) === g);
        if (items.length === 0) return null;
        return (
          <section key={g} className="flex flex-col gap-2">
            <p className={cn("eyebrow", g === "Overdue" && "text-pulse")}>
              {g} · {items.length}
            </p>
            <ul className="surface divide-y divide-cream-dark">
              {items.map((t) => (
                <TaskRow key={t.id} t={t} busy={busyId === t.id} onToggle={() => void toggle(t)} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
