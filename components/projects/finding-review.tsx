"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clipboard, Loader2, Plus, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client/api";
import { formatDateOnly } from "@/lib/format";
import { CLIENT_LABEL, FINDING_META, FINDING_ORDER, isChangeCategory } from "@/lib/projects/meta";
import type { ClientStatus, FindingCategory, FindingWithSource, Task } from "@/lib/projects/types";
import { cn } from "@/lib/utils";
import { CalendarLink } from "./calendar-link";

function Block({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-cream-dark pt-5">
      <div>
        <p className="eyebrow">{title}</p>
        {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

const CLIENT_STATES: ClientStatus[] = ["not_sent", "sent", "approved", "rejected"];

/** The freelancer's side: confirm or correct the finding, add notes, create a task, ask the client, record their answer. */
export function FindingReview({ finding: f, tasks }: { finding: FindingWithSource; tasks: Task[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState(f.notes ?? "");
  const [message, setMessage] = useState(f.client_message ?? "");
  const [taskTitle, setTaskTitle] = useState(f.suggested_follow_up ?? "");
  const [taskOwner, setTaskOwner] = useState("");
  const [taskDue, setTaskDue] = useState("");

  const reviewed = f.review_status === "reviewed";
  const askable = isChangeCategory(f.category);
  const myTasks = tasks.filter((t) => t.finding_id === f.id);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  };
  const patch = (key: string, body: Record<string, unknown>, ok?: string) =>
    run(key, async () => {
      await api(`/api/findings/${f.id}`, "PATCH", body);
      if (ok) toast.success(ok);
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Copied. Send it to your client yourself.");
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Block title="1 · Review" hint="Confirm what this is, or correct the classification.">
        <div className="flex flex-wrap gap-1.5">
          {FINDING_ORDER.map((c: FindingCategory) => (
            <button
              key={c}
              type="button"
              disabled={!!busy}
              onClick={() => c !== f.category && patch("category", { category: c }, "Classification updated.")}
              aria-pressed={c === f.category}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                c === f.category ? "border-dawn-strong bg-dawn" : "border-cream-dark bg-paper text-ink/70 hover:border-ink/20",
              )}
            >
              {FINDING_META[c].label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`notes-${f.id}`}>Notes</Label>
          <Textarea id={`notes-${f.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to remember about this…" className="min-h-16" />
          {notes !== (f.notes ?? "") && (
            <Button size="sm" variant="outline" className="self-start" disabled={!!busy} onClick={() => patch("notes", { notes: notes.trim() || null }, "Notes saved.")}>
              {busy === "notes" && <Loader2 className="animate-spin" />}
              Save notes
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {reviewed ? (
            <Button variant="outline" disabled={!!busy} onClick={() => patch("review", { review_status: "ai_detected" })}>
              <Undo2 />
              Undo review
            </Button>
          ) : (
            <Button disabled={!!busy} onClick={() => patch("review", { review_status: "reviewed" }, "Marked as reviewed.")}>
              {busy === "review" ? <Loader2 className="animate-spin" /> : <Check />}
              Mark reviewed
            </Button>
          )}
          {f.review_status !== "dismissed" ? (
            <Button variant="ghost" disabled={!!busy} onClick={() => patch("dismiss", { review_status: "dismissed" }, "Dismissed.")}>
              <X />
              Dismiss
            </Button>
          ) : (
            <Button variant="outline" disabled={!!busy} onClick={() => patch("restore", { review_status: "ai_detected" })}>
              <Undo2 />
              Restore
            </Button>
          )}
        </div>
      </Block>

      {f.review_status !== "dismissed" && (
        <Block title="2 · Follow-up task" hint="Optional. Nothing is created unless you add it.">
          {myTasks.length > 0 && (
            <ul className="flex flex-col gap-2">
              {myTasks.map((t) => (
                <li key={t.id} className="flex items-start gap-3 rounded-lg bg-secondary px-3 py-2.5 text-sm">
                  <button
                    type="button"
                    aria-label={t.status === "done" ? "Mark as open" : "Mark as done"}
                    disabled={!!busy}
                    onClick={() => run(`t-${t.id}`, () => api(`/api/tasks/${t.id}`, "PATCH", { status: t.status === "done" ? "open" : "done" }).then(() => undefined))}
                    className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-ink/30", t.status === "done" && "bg-fathom text-cream")}
                  >
                    {t.status === "done" && <Check className="size-3.5" />}
                  </button>
                  <span className="min-w-0">
                    <span className={cn("block font-semibold", t.status === "done" && "line-through opacity-60")}>
                      {t.title}
                      {t.auto_created && <span className="ml-2 rounded-full bg-dawn px-1.5 py-0.5 align-middle text-[0.65rem] font-semibold text-ink/70">from call</span>}
                    </span>
                    <span className="block text-xs text-ink-muted">
                      {t.owner ?? "Unassigned"} · {t.due_date ? formatDateOnly(t.due_date) : "No due date"}
                    </span>
                    {t.status === "open" && (
                      <CalendarLink title={t.title} date={t.due_date} details={`${f.title}\n“${f.source_quote}”\n(from Sera)`} className="-ml-1.5" />
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-2">
            <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Estimate the extra work" aria-label="Task title" />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input value={taskOwner} onChange={(e) => setTaskOwner(e.target.value)} placeholder="Owner (optional)" aria-label="Owner" />
              <Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} aria-label="Due date" />
            </div>
            <Button
              variant="outline"
              className="self-start"
              disabled={!taskTitle.trim() || !!busy}
              onClick={() =>
                run("task", async () => {
                  await api("/api/tasks", "POST", {
                    project_id: f.project_id,
                    finding_id: f.id,
                    title: taskTitle.trim(),
                    owner: taskOwner.trim() || null,
                    due_date: taskDue || null,
                  });
                  toast.success("Task added.");
                  setTaskTitle("");
                  setTaskOwner("");
                  setTaskDue("");
                })
              }
            >
              {busy === "task" ? <Loader2 className="animate-spin" /> : <Plus />}
              Add task
            </Button>
          </div>
        </Block>
      )}

      {askable && f.review_status !== "dismissed" && (
        <Block title="3 · Ask the client" hint="Sera drafts a message asking for approval. You send it yourself; nothing is sent automatically.">
          {!message ? (
            <Button
              variant="outline"
              className="self-start"
              disabled={!!busy}
              onClick={() =>
                run("gen", async () => {
                  const res = await api<{ message: string }>(`/api/findings/${f.id}/message`, "POST");
                  setMessage(res.message);
                })
              }
            >
              {busy === "gen" && <Loader2 className="animate-spin" />}
              Generate client confirmation message
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-56 text-[0.875rem]" aria-label="Client message" />
              <div className="flex flex-wrap gap-2">
                <Button onClick={copy}>
                  <Clipboard />
                  Copy message
                </Button>
                {message !== (f.client_message ?? "") && (
                  <Button variant="outline" disabled={!!busy} onClick={() => patch("msg", { client_message: message }, "Message saved.")}>
                    Save edits
                  </Button>
                )}
                <Button
                  variant="ghost"
                  disabled={!!busy}
                  onClick={() =>
                    run("gen", async () => {
                      const res = await api<{ message: string }>(`/api/findings/${f.id}/message`, "POST");
                      setMessage(res.message);
                    })
                  }
                >
                  Regenerate
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>What the client has done</Label>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-cream-dark bg-paper p-1 sm:grid-cols-4">
              {CLIENT_STATES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={!!busy || (!reviewed && s !== "not_sent")}
                  onClick={() => s !== f.client_status && patch("client", { client_status: s }, `Recorded: ${CLIENT_LABEL[s].toLowerCase()}.`)}
                  aria-pressed={f.client_status === s}
                  className={cn(
                    "rounded-md px-2 py-2 text-xs font-semibold transition-colors disabled:opacity-40",
                    f.client_status === s ? (s === "approved" ? "bg-success/40 text-success-dark" : s === "rejected" ? "bg-error-bg text-pulse" : "bg-dawn text-ink") : "text-ink/60 hover:text-ink",
                  )}
                >
                  {CLIENT_LABEL[s]}
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-muted">
              {reviewed
                ? "Approval is only recorded here, by you, once the client actually says yes. A mention in a call never counts."
                : "Mark the finding as reviewed before recording what the client did."}
            </p>
          </div>
        </Block>
      )}
    </div>
  );
}
