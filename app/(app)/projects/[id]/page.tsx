import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, CalendarDays, Check, ChevronRight, MessagesSquare, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AskBar } from "@/components/ask/ask-bar";
import { SampleBadge } from "@/components/common/badges";
import { EmptyState, SectionHeader } from "@/components/common/layout-bits";
import { AddConversationButton } from "@/components/projects/add-conversation";
import { EditAgreementButton } from "@/components/projects/project-form-dialog";
import { ProcessingLine } from "@/components/projects/project-bits";
import { TaskList } from "@/components/projects/task-list";
import { getViewer } from "@/lib/viewer";
import { formatClock, formatDateOnly, formatDayHeading, localDateOf } from "@/lib/format";
import { getProject } from "@/lib/projects/data";
import { FINDING_META, FINDING_ORDER, STATUS_TONE, awaitingClient, findingStatus, formatMoney, isChangeCategory, needsReview, type StatusTone } from "@/lib/projects/meta";
import type { FindingWithSource } from "@/lib/projects/types";
import { cn } from "@/lib/utils";

export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <div className="flex flex-col gap-8">
      <Link href="/projects" className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink/70 hover:text-ink">
        <ArrowLeft className="size-4" />
        Projects
      </Link>
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-card bg-cream-dark/60" />}>
        <ProjectContent params={params} />
      </Suspense>
    </div>
  );
}

/* ---------------------------------------------------------------- pieces */

const RANK: Record<string, number> = { "Needs your review": 0, "Not sent yet": 1, "Waiting on client": 2, "Client declined": 3 };

/** Where a possible change is, in plain words, plus its sort order. Client approval is never implied by review. */
function changeState(f: FindingWithSource) {
  const s = findingStatus(f);
  return { ...s, rank: RANK[s.label] ?? 4 };
}

const OTHER_LABEL: Partial<Record<FindingWithSource["category"], string>> = { existing_scope: "In scope", idea: "Idea" };

const isClientPromise = (f: FindingWithSource) => f.category === "commitment" && (f.owner_label ?? "").trim().toLowerCase() === "client";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function Fact({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hairline)] bg-paper px-3 py-1.5 text-sm font-semibold shadow-[var(--sera-shadow-soft)] [&_svg]:size-3.5">
      {icon}
      {children}
    </span>
  );
}

/** One finding as a single tidy row: dot, title, a short quote, where it came from, and its status. Opens the review. */
function FindingLine({ f, projectId, pill, tone }: { f: FindingWithSource; projectId: string; pill: string; tone: StatusTone }) {
  return (
    <li>
      <Link
        href={`/projects/${projectId}/conversations/${f.conversation_id}?finding=${f.id}`}
        className="-mx-3 flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-cream/70"
      >
        <span className={cn("mt-[0.45rem] size-2 shrink-0 rounded-full", FINDING_META[f.category].dot)} />
        <span className="min-w-0 flex-1">
          <span className="block leading-snug font-semibold">{f.title}</span>
          <span className="mt-1 block truncate font-serif text-[0.95rem] text-ink/65 italic">“{f.source_quote}”</span>
          <span className="mt-1 block text-xs text-ink-muted">
            {FINDING_META[f.category].label} · {f.conversation.title}
          </span>
        </span>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold whitespace-nowrap", STATUS_TONE[tone])}>{pill}</span>
      </Link>
    </li>
  );
}

function ColumnTitle({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <p className="eyebrow mb-3">
      {children}
      {count != null && <span className="ml-1.5 text-ink/40">{count}</span>}
    </p>
  );
}

/* ---------------------------------------------------------------- page */

async function ProjectContent({ params }: { params: PageProps<"/projects/[id]">["params"] }) {
  const { id } = await params;
  const [data, viewer] = await Promise.all([getProject(id), getViewer()]);
  if (!data) notFound();
  const { project: p, conversations, findings, tasks } = data;

  const live = findings.filter((f) => f.review_status !== "dismissed");
  const changes = live.filter((f) => isChangeCategory(f.category));
  // What's in the deal now = original agreement + what the client approved later (shown, never merged in).
  const approved = changes.filter((f) => f.review_status === "reviewed" && f.client_status === "approved");
  const open = changes
    .filter((f) => !approved.includes(f))
    .map((f) => ({ f, s: changeState(f) }))
    .sort((a, b) => a.s.rank - b.s.rank || FINDING_ORDER.indexOf(a.f.category) - FINDING_ORDER.indexOf(b.f.category));
  const toReview = changes.filter(needsReview);
  const waiting = changes.filter(awaitingClient);
  const others = live.filter((f) => !isChangeCategory(f.category) && f.category !== "commitment");
  const clientPromises = live.filter(isClientPromise);
  // Your promises become tasks automatically; promises with no owner stated don't, so list them here and nothing is lost.
  const untracked = live.filter((f) => f.category === "commitment" && !(f.owner_label ?? "").trim() && !tasks.some((t) => t.finding_id === f.id));
  const openTasks = tasks.filter((t) => t.status === "open").sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
  const next = openTasks[0];

  // Deadline corrections are surfaced next to, never over, the original deadline.
  const discussedDeadlines = live.filter(
    (f) => f.category === "scope_modification" && f.due_date && /deadline|due|deliver/i.test(`${f.title} ${f.related_scope_item ?? ""}`),
  );
  const calls = [...conversations].reverse(); // latest first

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="eyebrow">{p.client_name}</span>
          {p.is_sample && <SampleBadge />}
        </div>
        <h1 className="display text-[2.6rem] sm:text-6xl">{p.name}</h1>
        {p.original_description && <p className="max-w-2xl text-base text-ink-muted sm:text-lg">{p.original_description}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Fact>{formatMoney(p.fixed_price, p.currency)}</Fact>
          <Fact icon={<CalendarDays />}>{p.deadline ? `Due ${formatDateOnly(p.deadline)}` : "No deadline"}</Fact>
          {discussedDeadlines.map((f) => (
            <span key={f.id} className="rounded-full bg-purple/15 px-3 py-1.5 text-xs font-semibold text-[#5b4596]">
              Discussed {formatDateOnly(f.due_date!)}, not confirmed
            </span>
          ))}
          <Fact icon={<MessagesSquare />}>{plural(conversations.length, "call")}</Fact>
        </div>
        {conversations.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {toReview.length > 0 ? (
              <a href="#scope" className="inline-flex items-center gap-2 rounded-full bg-warning px-3 py-1.5 font-semibold text-warning-dark hover:underline">
                <span className="size-1.5 rounded-full bg-[#c27a2c]" />
                {plural(toReview.length, "change")} to review
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-success px-3 py-1.5 font-semibold text-success-dark">
                <Check className="size-3.5" />
                Nothing to review
              </span>
            )}
            {waiting.length > 0 && <span className="font-semibold text-ink/70">Waiting on the client for {waiting.length}</span>}
            {next && (
              <span className="text-ink/70">
                Next up: <span className="font-semibold text-ink">{next.title}</span>
                {next.due_date && ` · ${formatDateOnly(next.due_date)}`}
              </span>
            )}
          </div>
        )}
      </header>

      {conversations.length > 0 && (
        <AskBar
          projectId={p.id}
          placeholder={`Ask about ${p.name}…`}
          suggestions={["What are the deadlines and dates for this project?", "Was anything flagged in the last meeting?", "Revise the project and draft an email to the client"]}
        />
      )}

      <section id="scope" className="flex scroll-mt-24 flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader title="Scope" />
          <EditAgreementButton project={p} />
        </div>
        <div className="surface grid grid-cols-1 md:grid-cols-2">
          <div className="min-w-0 p-5 sm:p-6">
            <ColumnTitle>Agreed</ColumnTitle>
            {p.agreed_scope.length === 0 && approved.length === 0 ? (
              <p className="rounded-md bg-warning px-3 py-2 text-sm font-semibold text-warning-dark">
                No deliverables recorded yet. Add them with Edit agreement so Sera has something to compare against.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {p.agreed_scope.map((s) => (
                  <li key={s} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-success-dark" />
                    {s}
                  </li>
                ))}
                {approved.map((f) => (
                  <li key={f.id} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-success-dark" />
                    <span>
                      {f.title}{" "}
                      <span className="ml-1 rounded-full bg-success px-2 py-0.5 align-middle text-[0.7rem] font-semibold whitespace-nowrap text-success-dark">
                        Approved later
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {p.exclusions.length > 0 && (
              <>
                <p className="eyebrow mt-6 mb-3">Not included</p>
                <ul className="flex flex-col gap-2.5">
                  {p.exclusions.map((s) => (
                    <li key={s} className="flex items-start gap-2.5 text-ink/60">
                      <X className="mt-0.5 size-4 shrink-0 text-pulse/70" />
                      {s}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div className="min-w-0 border-t border-cream-dark p-5 sm:p-6 md:border-t-0 md:border-l">
            <ColumnTitle count={open.length}>Since then</ColumnTitle>
            {open.length === 0 ? (
              <p className="text-sm text-ink-muted">
                {conversations.length === 0 ? "Record a call and anything new the client asks for shows up here." : "Nothing new asked for. Everything discussed fits the agreement."}
              </p>
            ) : (
              <ul className="flex flex-col">
                {open.map(({ f, s }) => (
                  <FindingLine key={f.id} f={f} projectId={p.id} pill={s.label} tone={s.tone} />
                ))}
              </ul>
            )}
            {others.length > 0 && (
              <details className="group mt-3 border-t border-cream-dark pt-3">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-ink/70 hover:text-ink">
                  <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
                  Also noted: {plural(others.length, "item")} already in scope or ideas for later
                </summary>
                <ul className="mt-1 flex flex-col">
                  {others.map((f) => (
                    <FindingLine key={f.id} f={f} projectId={p.id} pill={OTHER_LABEL[f.category] ?? "Noted"} tone="muted" />
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader title="To do" count={openTasks.length} />
        <div className={cn("surface grid grid-cols-1", clientPromises.length > 0 && "md:grid-cols-2")}>
          <div className="min-w-0 p-5 sm:p-6">
            <ColumnTitle>Your tasks</ColumnTitle>
            <TaskList tasks={tasks.filter((t) => t.status === "open" || tasks.length <= 8)} projectName={p.name} />
            {untracked.length > 0 && (
              <>
                <p className="eyebrow mt-6 mb-1">Promised on a call</p>
                <ul className="flex flex-col">
                  {untracked.map((f) => (
                    <FindingLine key={f.id} f={f} projectId={p.id} pill={f.due_date ? formatDateOnly(f.due_date) : "No date"} tone="muted" />
                  ))}
                </ul>
              </>
            )}
          </div>
          {clientPromises.length > 0 && (
            <div className="min-w-0 border-t border-cream-dark p-5 sm:p-6 md:border-t-0 md:border-l">
              <ColumnTitle count={clientPromises.length}>The client promised</ColumnTitle>
              <ul className="flex flex-col">
                {clientPromises.map((f) => (
                  <FindingLine key={f.id} f={f} projectId={p.id} pill={f.due_date ? formatDateOnly(f.due_date) : "No date"} tone="waiting" />
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader title="Calls" count={conversations.length} />
          {conversations.length > 0 && <AddConversationButton projectId={p.id} variant="outline" size="sm" />}
        </div>
        {conversations.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare />}
            title="No calls yet."
            body="Record or add a client call and Sera will compare it with the agreement."
            action={<AddConversationButton projectId={p.id} />}
          />
        ) : (
          <ol className="surface divide-y divide-cream-dark">
            {calls.map((c, i) => (
              <li key={c.id}>
                <Link href={`/projects/${p.id}/conversations/${c.id}`} className="group flex items-start gap-4 p-5 transition-colors hover:bg-cream/60">
                  <div className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="eyebrow">
                        {formatDayHeading(localDateOf(c.recorded_at, viewer.timezone))} · {formatClock(c.recorded_at, viewer.timezone)}
                      </span>
                      {i === 0 && conversations.length > 1 && (
                        <span className="rounded-full bg-dawn px-2 py-0.5 text-[0.7rem] font-semibold">Latest</span>
                      )}
                      {c.is_sample && <SampleBadge />}
                    </span>
                    <span className="mt-1.5 block font-semibold">{c.title}</span>
                    {c.summary && <span className="mt-1 line-clamp-2 block text-sm text-ink-muted">{c.summary}</span>}
                    {c.processing_status !== "completed" && (
                      <span className="mt-2 block">
                        <ProcessingLine status={c.processing_status} />
                      </span>
                    )}
                  </div>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
