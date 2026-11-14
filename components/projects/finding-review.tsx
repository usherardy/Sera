"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, ChevronRight, Clipboard, Loader2, Mail, Plus, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client/api";
import { formatDateOnly } from "@/lib/format";
import { CLIENT_LABEL, FINDING_META, FINDING_ORDER, isChangeCategory } from "@/lib/projects/meta";
import { changeRequestSubject, gmailComposeUrl, outlookComposeUrl } from "@/lib/projects/email";
import type { ClientStatus, FindingCategory, FindingWithSource, Project, Task } from "@/lib/projects/types";
import { cn } from "@/lib/utils";
import { CalendarLink } from "./calendar-link";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-cream-dark pt-5">
      <div>
        <p className="font-semibold">{title}</p>
        {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** A quiet row that folds extra controls away until they're needed. */
function Fold({ label, defaultOpen, children }: { label: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-ink/70 hover:text-ink">
        <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
        {label}
      </summary>
      <div className="mt-3 flex flex-col gap-2 pl-5.5">{children}</div>
    </details>
  );
}

const CLIENT_STATES: ClientStatus[] = ["not_sent", "sent", "approved", "rejected"];

/** Your side: confirm or dismiss the finding, ask the client and record their answer, add tasks and notes. */
export function FindingReview({ finding: f, tasks, project }: { finding: FindingWithSource; tasks: Task[]; project: Pick<Project, "name" | "client_name"> }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState(f.notes ?? "");
  const [message, setMessage] = useState(f.client_message ?? "");
  const [subject, setSubject] = useState(changeRequestSubject(project.name, f.title));
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
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${message}`);
      toast.success("Copied with the subject. Send it to your client yourself.");
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  };

  const generate = () =>
    run("gen", async () => {
      const res = await api<{ message: string }>(`/api/findings/${f.id}/message`, "POST");
      setMessage(res.message);
    });

  return (
    <div className="flex flex-col gap-5">
      {/* Decide */}
      <section className="flex flex-col gap-3 border-t border-cream-dark pt-5 lg:border-t-0 lg:pt-0">
        <div className="flex flex-wrap gap-2">
          {f.review_status === "dismissed" ? (
            <Button variant="outline" disabled={!!busy} onClick={() => patch("restore", { review_status: "ai_detected" })}>
              <Undo2 />
              Restore
            </Button>
          ) : (
            <>
              {reviewed ? (
                <Button variant="outline" disabled={!!busy} onClick={() => patch("review", { review_status: "ai_detected" })}>
                  <Undo2 />
                  Undo confirm
                </Button>
              ) : (
                <Button disabled={!!busy} onClick={() => patch("review", { review_status: "reviewed" }, "Confirmed.")}>
                  {busy === "review" ? <Loader2 className="animate-spin" /> : <Check />}
                  Confirm
                </Button>
              )}
              <Button variant="ghost" disabled={!!busy} onClick={() => patch("dismiss", { review_status: "dismissed" }, "Dismissed.")}>
                <X />
                Dismiss
              </Button>
            </>
          )}
        </div>
        <Fold label="Wrong type? Change it">
          <div className="flex flex-wrap gap-1.5">
            {FINDING_ORDER.map((c: FindingCategory) => (
              <button
                key={c}
                type="button"
                disabled={!!busy}
                onClick={() => c !== f.category && patch("category", { category: c }, "Type updated.")}
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
        </Fold>
      </section>

      {askable && f.review_status !== "dismissed" && (
        <Section title="Ask the client" hint="Sera drafts the email. Open it in Gmail or Outlook, add the client's address, check it and press Send.">
          {!message ? (
            <Button variant="outline" className="self-start" disabled={!!busy} onClick={generate}>
              {busy === "gen" ? <Loader2 className="animate-spin" /> : <Mail />}
              Draft the email
            </Button>
          ) : (
            <div className="overflow-hidden rounded-card border border-[var(--hairline)] bg-paper shadow-[var(--sera-shadow-soft)]">
              <div className="flex items-center justify-between gap-3 border-b border-cream-dark bg-cream/60 px-4 py-2.5">
                <span className="inline-flex items-center gap-2 text-xs font-semibold">
                  <Mail className="size-3.5" />
                  Email draft
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success px-2.5 py-1 text-[0.7rem] font-semibold text-success-dark">
                  <span className="size-1.5 rounded-full bg-success-dark" />
                  Opens in Gmail
                </span>
              </div>
              <div className="flex items-center gap-3 border-b border-cream-dark px-4 py-2.5 text-sm">
                <span className="w-14 shrink-0 text-ink-muted">To</span>
                <span className="font-semibold">{project.client_name}</span>
                <span className="text-xs text-ink-muted">add their address in Gmail</span>
              </div>
              <label className="flex items-center gap-3 border-b border-cream-dark px-4 py-1.5 text-sm">
                <span className="w-14 shrink-0 text-ink-muted">Subject</span>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} className="h-8 min-w-0 flex-1 bg-transparent font-semibold outline-none" aria-label="Subject" />
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-56 rounded-none border-0 bg-transparent px-4 py-3 text-[0.9rem] leading-relaxed shadow-none focus-visible:ring-0"
                aria-label="Email body"
              />
              <div className="flex flex-wrap items-center gap-2 border-t border-cream-dark bg-cream/40 px-3 py-2.5">
                <a
                  href={gmailComposeUrl({ subject, body: message })}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => toast.success("Opened in Gmail. Once you've sent it, set the client's answer to Sent.")}
                  className={buttonVariants({ size: "sm" })}
                >
                  <Mail />
                  Open in Gmail
                  <ArrowUpRight />
                </a>
                <a
                  href={outlookComposeUrl({ subject, body: message })}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => toast.success("Opened in Outlook. Once you've sent it, set the client's answer to Sent.")}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  Outlook
                </a>
                <Button size="sm" variant="ghost" onClick={copy}>
                  <Clipboard />
                  Copy
                </Button>
                <span className="flex-1" />
                {message !== (f.client_message ?? "") && (
                  <Button size="sm" variant="outline" disabled={!!busy} onClick={() => patch("msg", { client_message: message }, "Draft saved.")}>
                    Save edits
                  </Button>
                )}
                <Button size="sm" variant="ghost" disabled={!!busy} onClick={generate}>
                  {busy === "gen" && <Loader2 className="animate-spin" />}
                  Redraft
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Label>Client&apos;s answer</Label>
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
              {reviewed ? "Only record a yes once the client actually says it. A mention on a call never counts." : "Confirm the finding first, then record what the client did."}
            </p>
          </div>
        </Section>
      )}

      {f.review_status !== "dismissed" && (
        <Section title="Follow-up">
          {myTasks.length > 0 && (
            <ul className="flex flex-col gap-2">
              {myTasks.map((t) => (
                <li key={t.id} className="flex items-start gap-3 rounded-lg bg-paper px-3 py-2.5 text-sm shadow-[var(--sera-shadow-soft)]">
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
          <Fold label={myTasks.length > 0 ? "Add another task" : "Add a task"}>
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
          </Fold>
          <Fold label={f.notes ? "Your note" : "Add a note"} defaultOpen={!!f.notes}>
            <Textarea id={`notes-${f.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to remember about this…" className="min-h-16" aria-label="Notes" />
            {notes !== (f.notes ?? "") && (
              <Button size="sm" variant="outline" className="self-start" disabled={!!busy} onClick={() => patch("notes", { notes: notes.trim() || null }, "Note saved.")}>
                {busy === "notes" && <Loader2 className="animate-spin" />}
                Save note
              </Button>
            )}
          </Fold>
        </Section>
      )}

      <p className="border-t border-cream-dark pt-4 text-xs text-ink-muted">
        Sera&apos;s findings are suggestions for you to check. They aren&apos;t legal advice and don&apos;t mean the client agreed to anything.
      </p>
    </div>
  );
}
