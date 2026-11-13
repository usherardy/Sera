import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, CalendarDays, FileText, MessagesSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SampleBadge } from "@/components/common/badges";
import { EmptyState, SectionHeader } from "@/components/common/layout-bits";
import { AddConversationButton } from "@/components/projects/add-conversation";
import { EditAgreementButton } from "@/components/projects/project-form-dialog";
import { FindingBadge, ProcessingLine, StatusPills } from "@/components/projects/project-bits";
import { TaskList } from "@/components/projects/task-list";
import { getViewer } from "@/lib/viewer";
import { formatClock, formatDateOnly, formatDayHeading, localDateOf } from "@/lib/format";
import { getProject } from "@/lib/projects/data";
import { FINDING_ORDER, awaitingClient, formatMoney, isChangeCategory, needsReview } from "@/lib/projects/meta";
import type { FindingWithSource } from "@/lib/projects/types";

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

function Stat({ value, label, tone }: { value: number; label: string; tone?: "alert" }) {
  return (
    <div className="surface px-4 py-3">
      <p className={`font-serif text-3xl leading-none ${tone === "alert" && value > 0 ? "text-[#8a4d00]" : ""}`}>{value}</p>
      <p className="mt-1 text-xs font-semibold text-ink-muted">{label}</p>
    </div>
  );
}

function FindingRow({ f, projectId }: { f: FindingWithSource; projectId: string }) {
  return (
    <li>
      <Link
        href={`/projects/${projectId}/conversations/${f.conversation_id}?finding=${f.id}`}
        className="flex flex-col gap-2 p-4 transition-colors hover:bg-cream/60"
      >
        <span className="flex flex-wrap items-center gap-2">
          <FindingBadge category={f.category} />
          <StatusPills review={f.review_status} client={f.client_status} />
        </span>
        <span className="font-semibold">{f.title}</span>
        <span className="border-l-[3px] border-dawn-strong pl-3 font-serif text-base leading-snug text-ink/80 italic">“{f.source_quote}”</span>
        <span className="eyebrow">From {f.conversation.title}</span>
      </Link>
    </li>
  );
}

async function ProjectContent({ params }: { params: PageProps<"/projects/[id]">["params"] }) {
  const { id } = await params;
  const [data, viewer] = await Promise.all([getProject(id), getViewer()]);
  if (!data) notFound();
  const { project: p, conversations, findings, tasks } = data;

  const live = findings.filter((f) => f.review_status !== "dismissed");
  const changes = live.filter((f) => isChangeCategory(f.category));
  const toReview = changes.filter(needsReview);
  const waiting = live.filter(awaitingClient);
  const commitments = live.filter((f) => f.category === "commitment");
  const others = live.filter((f) => !isChangeCategory(f.category) && f.category !== "commitment");
  const openTasks = tasks.filter((t) => t.status === "open");

  // Deadline corrections are surfaced next to, never over, the original deadline.
  const discussedDeadlines = live.filter(
    (f) => f.category === "scope_modification" && f.due_date && /deadline|due|deliver/i.test(`${f.title} ${f.related_scope_item ?? ""}`),
  );
  const orderIdx = (f: FindingWithSource) => FINDING_ORDER.indexOf(f.category);
  const sortedChanges = [...changes].sort((a, b) => orderIdx(a) - orderIdx(b));

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="eyebrow">{p.client_name}</span>
          {p.is_sample && <SampleBadge />}
        </div>
        <h1 className="display text-[2.6rem] sm:text-6xl">{p.name}</h1>
        {p.original_description && <p className="max-w-2xl text-base text-ink-muted sm:text-lg">{p.original_description}</p>}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          <Stat value={conversations.length} label="Conversations" />
          <Stat value={toReview.length} label="Changes to review" tone="alert" />
          <Stat value={waiting.length} label="Awaiting client" />
          <Stat value={openTasks.length} label="Open follow-ups" />
        </div>
        {toReview.length > 0 ? (
          <p className="rounded-card bg-glow/20 px-4 py-3 text-sm font-semibold text-[#8a4d00]">
            {toReview.length} possible change{toReview.length === 1 ? "" : "s"} to the original agreement need{toReview.length === 1 ? "s" : ""} your review.
          </p>
        ) : conversations.length > 0 ? (
          <p className="rounded-card bg-success/25 px-4 py-3 text-sm font-semibold text-success-dark">Nothing waiting for your review.</p>
        ) : null}
      </header>

      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader title="Original agreement" />
          <EditAgreementButton project={p} />
        </div>
        <div className="surface grid gap-6 p-5 sm:grid-cols-[1fr_1fr] sm:p-6">
          <div>
            <p className="eyebrow mb-3">Agreed deliverables</p>
            <ul className="flex flex-col gap-2">
              {p.agreed_scope.map((s) => (
                <li key={s} className="flex items-start gap-2.5 text-[0.9375rem]">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-fathom" />
                  {s}
                </li>
              ))}
            </ul>
            {p.exclusions.length > 0 && (
              <>
                <p className="eyebrow mt-6 mb-3">Not included</p>
                <ul className="flex flex-col gap-2">
                  {p.exclusions.map((s) => (
                    <li key={s} className="flex items-start gap-2.5 text-[0.9375rem] text-ink/80">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-pulse" />
                      {s}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <dl className="flex flex-col gap-4">
            <div>
              <dt className="eyebrow">Fixed price</dt>
              <dd className="font-serif text-3xl">{formatMoney(p.fixed_price, p.currency)}</dd>
            </div>
            <div>
              <dt className="eyebrow">Original deadline</dt>
              <dd className="inline-flex items-center gap-2 font-serif text-3xl">
                <CalendarDays className="size-5" />
                {p.deadline ? formatDateOnly(p.deadline) : "Not set"}
              </dd>
              {discussedDeadlines.map((f) => (
                <dd key={f.id} className="mt-2 rounded-md bg-purple/15 px-2.5 py-1.5 text-xs font-semibold text-[#5b4596]">
                  Discussed: {formatDateOnly(f.due_date!)} (not confirmed by the client)
                </dd>
              ))}
            </div>
          </dl>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader title="Conversations" count={conversations.length} />
          {conversations.length > 0 && <AddConversationButton projectId={p.id} variant="outline" size="sm" />}
        </div>
        {conversations.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare />}
            title="No conversations yet."
            body="Add a client conversation and SERA will compare it with the original agreement."
            action={<AddConversationButton projectId={p.id} />}
          />
        ) : (
          <ul className="surface divide-y-2 divide-cream-dark">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link href={`/projects/${p.id}/conversations/${c.id}`} className="flex flex-col gap-1.5 p-4 transition-colors hover:bg-cream/60">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{c.title}</span>
                    <ProcessingLine status={c.processing_status} />
                  </span>
                  <span className="eyebrow">
                    {formatDayHeading(localDateOf(c.recorded_at, viewer.timezone))} · {formatClock(c.recorded_at, viewer.timezone)}
                    {c.is_sample && " · Sample"}
                  </span>
                  {c.summary && <span className="text-sm text-ink-muted">{c.summary}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader title="Scope changes" count={changes.length} />
        {sortedChanges.length === 0 ? (
          <EmptyState
            icon={<FileText />}
            title="No scope changes detected."
            body="Possible additions, changes and open questions from your conversations appear here, each with its evidence."
          />
        ) : (
          <ul className="surface divide-y-2 divide-cream-dark">
            {sortedChanges.map((f) => (
              <FindingRow key={f.id} f={f} projectId={p.id} />
            ))}
          </ul>
        )}
        {others.length > 0 && (
          <details className="surface group">
            <summary className="cursor-pointer list-none p-4 text-sm font-semibold">
              Also noted <span className="font-mono text-ink-muted">{others.length}</span>
              <span className="ml-2 text-ink-muted">already in scope, ideas for later</span>
            </summary>
            <ul className="divide-y-2 divide-cream-dark border-t-2 border-cream-dark">
              {others.map((f) => (
                <FindingRow key={f.id} f={f} projectId={p.id} />
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader title="Follow-through" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="surface flex flex-col gap-3 p-5">
            <p className="eyebrow">Commitments</p>
            {commitments.length === 0 ? (
              <p className="text-sm text-ink-muted">None detected.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {commitments.map((f) => (
                  <li key={f.id} className="text-sm">
                    <Link href={`/projects/${p.id}/conversations/${f.conversation_id}?finding=${f.id}`} className="font-semibold hover:underline">
                      {f.title}
                    </Link>
                    <span className="block text-xs text-ink-muted">
                      {f.owner_label ?? "Owner not stated"} · {f.due_date ? formatDateOnly(f.due_date) : "No deadline stated"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="surface flex flex-col gap-3 p-5">
            <p className="eyebrow">Tasks</p>
            <TaskList tasks={tasks.filter((t) => t.status === "open" || tasks.length <= 8)} />
          </div>
          <div className="surface flex flex-col gap-3 p-5">
            <p className="eyebrow">Awaiting client</p>
            {waiting.length === 0 ? (
              <p className="text-sm text-ink-muted">No approvals pending.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {waiting.map((f) => (
                  <li key={f.id} className="text-sm">
                    <Link href={`/projects/${p.id}/conversations/${f.conversation_id}?finding=${f.id}`} className="font-semibold hover:underline">
                      {f.title}
                    </Link>
                    <span className="block text-xs text-ink-muted">{f.client_status === "sent" ? "Sent, no reply recorded" : "Not sent yet"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
