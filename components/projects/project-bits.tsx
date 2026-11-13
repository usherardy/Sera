import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import { SampleBadge } from "@/components/common/badges";
import { formatDateOnly } from "@/lib/format";
import { CLIENT_LABEL, FINDING_META, REVIEW_LABEL, formatMoney } from "@/lib/projects/meta";
import type { ClientStatus, Finding, FindingCategory, ProcessingStatus, ProjectSummary, ReviewStatus } from "@/lib/projects/types";
import { cn } from "@/lib/utils";

export function FindingBadge({ category, className }: { category: FindingCategory; className?: string }) {
  const meta = FINDING_META[category];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", meta.badge, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

/** Review + client status for a finding. Client approval is never implied by review. */
export function StatusPills({ review, client, show = "both" }: { review: ReviewStatus; client: ClientStatus; show?: "both" | "review" }) {
  const reviewTone =
    review === "ai_detected" ? "bg-warning text-warning-dark" : review === "dismissed" ? "bg-secondary text-ink-muted" : "bg-success/30 text-success-dark";
  const clientTone =
    client === "approved"
      ? "bg-success/30 text-success-dark"
      : client === "rejected"
        ? "bg-error-bg text-pulse"
        : client === "sent"
          ? "bg-dawn text-ink"
          : "bg-secondary text-ink-muted";
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", reviewTone)}>{REVIEW_LABEL[review]}</span>
      {show === "both" && review === "reviewed" && (
        <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", clientTone)}>{CLIENT_LABEL[client]}</span>
      )}
    </span>
  );
}

const PROCESSING_COPY: Record<ProcessingStatus, string> = {
  pending: "Not analyzed yet",
  analyzing: "Analyzing…",
  completed: "Analyzed",
  failed: "Couldn't analyze",
};

export function ProcessingLine({ status }: { status: ProcessingStatus }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success-dark">
        <CheckCircle2 className="size-3.5" />
        {PROCESSING_COPY[status]}
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-pulse">
        <AlertTriangle className="size-3.5" />
        {PROCESSING_COPY[status]}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", status === "analyzing" ? "text-purple" : "text-ink-muted")}>
      {status === "analyzing" && <Loader2 className="size-3.5 animate-spin" />}
      {PROCESSING_COPY[status]}
    </span>
  );
}

export function ProjectCard({ project: p }: { project: ProjectSummary }) {
  return (
    <Link
      href={`/projects/${p.id}`}
      className="surface group flex flex-col gap-4 p-5 transition-colors hover:border-ink/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow truncate">{p.client_name}</p>
          <h3 className="display mt-1.5 text-3xl">{p.name}</h3>
        </div>
        <ArrowUpRight className="size-5 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-md bg-secondary px-2 py-1 font-semibold">{formatMoney(p.fixed_price, p.currency)}</span>
        <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-semibold">
          <CalendarDays className="size-3.5" />
          {p.deadline ? formatDateOnly(p.deadline) : "No deadline"}
        </span>
        {p.is_sample && <SampleBadge />}
      </div>
      <div className="flex items-center justify-between border-t-2 border-cream-dark pt-3 text-sm">
        <span className="text-ink-muted">
          {p.conversation_count} conversation{p.conversation_count === 1 ? "" : "s"}
        </span>
        {p.pending_changes > 0 ? (
          <span className="rounded-full bg-glow/25 px-2.5 py-1 text-xs font-semibold text-[#8a4d00]">
            {p.pending_changes} change{p.pending_changes === 1 ? "" : "s"} to review
          </span>
        ) : (
          <span className="text-xs font-semibold text-ink-muted">Nothing to review</span>
        )}
      </div>
    </Link>
  );
}

/** One finding in a list: type, status, title, the quote, and where it came from. Links to its review. */
export function FindingListItem({ f, href, context }: { f: Finding; href: string; context: string }) {
  return (
    <li>
      <Link href={href} className="flex flex-col gap-2 p-4 transition-colors hover:bg-cream/60">
        <span className="flex flex-wrap items-center gap-2">
          <FindingBadge category={f.category} />
          <StatusPills review={f.review_status} client={f.client_status} />
          {f.is_sample && <SampleBadge />}
        </span>
        <span className="font-semibold">{f.title}</span>
        <span className="border-l-[3px] border-dawn-strong pl-3 font-serif text-base leading-snug text-ink/80 italic">“{f.source_quote}”</span>
        <span className="eyebrow">{context}</span>
      </Link>
    </li>
  );
}
