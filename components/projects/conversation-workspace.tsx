"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { ConfidenceMeter, SampleBadge } from "@/components/common/badges";
import { EmptyState, EvidenceQuote } from "@/components/common/layout-bits";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { FindingReview } from "@/components/projects/finding-review";
import { FindingBadge, StatusPills } from "@/components/projects/project-bits";
import { normalizeForMatch, parseTranscript } from "@/lib/projects/grounding";
import { FINDING_META, FINDING_ORDER, STATUS_TONE, findingStatus } from "@/lib/projects/meta";
import type { FindingWithSource, Project, Task } from "@/lib/projects/types";
import { cn } from "@/lib/utils";

const MIN_MATCH = 8;

function lineBacks(lineNorm: string, quoteNorm: string) {
  if (lineNorm.length < MIN_MATCH || quoteNorm.length < MIN_MATCH) return false;
  return lineNorm.includes(quoteNorm) || quoteNorm.includes(lineNorm);
}

/** Read-only detail of a finding: what it is, the exact words, and why Sera flagged it. */
export function FindingDetail({ finding: f, project }: { finding: FindingWithSource; project: Pick<Project, "agreed_scope" | "exclusions"> }) {
  const related = f.related_scope_item;
  const status = findingStatus(f);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <FindingBadge category={f.category} />
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_TONE[status.tone])}>{status.label}</span>
        {f.is_sample && <SampleBadge />}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="display text-3xl sm:text-4xl">{f.title}</h3>
        {f.description && <p className="text-[0.9375rem] text-ink-muted">{f.description}</p>}
      </div>

      <EvidenceQuote meta={`Said in ${f.conversation.title}`}>{f.source_quote}</EvidenceQuote>

      <div className="flex flex-col gap-2.5 rounded-card bg-paper p-4 text-sm shadow-[var(--sera-shadow-soft)]">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">Why Sera flagged it</p>
          <ConfidenceMeter confidence={f.confidence} />
        </div>
        {f.explanation && <p className="leading-relaxed text-ink/85">{f.explanation}</p>}
        <p className="text-ink-muted">
          Agreement:{" "}
          {related ? (
            <>
              <span className="font-semibold text-ink">{related}</span>
              {project.exclusions.includes(related) && <span className="ml-1.5 rounded-full bg-error-bg px-2 py-0.5 text-xs font-semibold text-pulse">not included</span>}
            </>
          ) : (
            "nothing in it matches this."
          )}
        </p>
      </div>
    </div>
  );
}

export function ConversationWorkspace({
  transcript,
  findings,
  project,
  tasks,
  initialFindingId,
}: {
  transcript: string;
  findings: FindingWithSource[];
  project: Pick<Project, "agreed_scope" | "exclusions">;
  tasks: Task[];
  initialFindingId: string | null;
}) {
  const initial = initialFindingId && findings.some((f) => f.id === initialFindingId) ? initialFindingId : null;
  const [selectedId, setSelectedId] = useState<string | null>(initial);
  const [open, setOpen] = useState(initial !== null);
  const lineRefs = useRef<Map<number, HTMLLIElement>>(new Map());

  const lines = useMemo(() => parseTranscript(transcript).map((l) => ({ ...l, norm: normalizeForMatch(l.text) })), [transcript]);
  const quoteNorms = useMemo(() => findings.map((f) => ({ id: f.id, norm: normalizeForMatch(f.source_quote) })), [findings]);
  const selected = findings.find((f) => f.id === selectedId) ?? null;

  const lineState = (norm: string): "selected" | "evidence" | null => {
    const hits = quoteNorms.filter((q) => lineBacks(norm, q.norm));
    if (hits.length === 0) return null;
    return selectedId && hits.some((h) => h.id === selectedId) ? "selected" : "evidence";
  };

  useEffect(() => {
    if (!selectedId) return;
    const q = quoteNorms.find((x) => x.id === selectedId);
    const target = q && lines.find((l) => lineBacks(l.norm, q.norm));
    if (target) lineRefs.current.get(target.idx)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [selectedId, quoteNorms, lines]);

  const sorted = [...findings].sort((a, b) => FINDING_ORDER.indexOf(a.category) - FINDING_ORDER.indexOf(b.category));

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
      <section className="flex flex-col gap-4">
        <h2 className="display text-3xl">Transcript</h2>
        <ol className="surface flex max-h-[38rem] flex-col gap-1 overflow-y-auto p-3 sm:p-4">
          {lines.map((l) => {
            const state = lineState(l.norm);
            return (
              <li
                key={l.idx}
                ref={(el) => {
                  if (el) lineRefs.current.set(l.idx, el);
                  else lineRefs.current.delete(l.idx);
                }}
                className={cn(
                  "rounded-lg px-3 py-2 text-[0.9375rem] leading-relaxed transition-colors",
                  state === "selected" && "bg-dawn ring-1 ring-purple/30",
                  state === "evidence" && "bg-dawn/40",
                )}
              >
                {l.speaker && <span className="mr-2 font-mono text-xs font-medium tracking-wide text-ink-muted uppercase">{l.speaker}</span>}
                {l.text}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="display text-3xl">
          Findings <span className="font-mono text-sm tracking-normal text-ink-muted">{findings.length}</span>
        </h2>
        {findings.length === 0 ? (
          <EmptyState icon={<FileText />} title="Nothing to flag." body="No requests, changes or commitments were found in this conversation." />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {sorted.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(f.id);
                    setOpen(true);
                  }}
                  aria-pressed={f.id === selectedId}
                  className={cn(
                    "surface flex w-full flex-col gap-2 p-4 text-left transition-colors",
                    f.id === selectedId ? "border-purple/30 bg-paper shadow-[var(--sera-shadow-lift)]" : "hover:border-ink/20",
                  )}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <FindingBadge category={f.category} />
                    <StatusPills review={f.review_status} client={f.client_status} show="review" />
                    {f.is_sample && <SampleBadge />}
                  </span>
                  <span className="font-semibold">{f.title}</span>
                  <span className="text-xs text-ink-muted">{FINDING_META[f.category].hint}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Sheet open={open && !!selected} onOpenChange={setOpen}>
          <SheetContent className="w-full gap-0 overflow-y-auto bg-cream p-5 data-[side=right]:sm:max-w-xl sm:p-7">
            <SheetTitle className="sr-only">{selected?.title ?? "Finding"}</SheetTitle>
            <SheetDescription className="sr-only">Review this finding against the original agreement.</SheetDescription>
            {selected && (
              <div className="flex flex-col gap-6 pt-6" key={selected.id}>
                <FindingDetail finding={selected} project={project} />
                <FindingReview finding={selected} tasks={tasks} />
              </div>
            )}
          </SheetContent>
        </Sheet>
      </section>
    </div>
  );
}
