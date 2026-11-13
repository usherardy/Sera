"use client";

import { useState } from "react";
import { ListChecks } from "lucide-react";
import { EmptyState } from "@/components/common/layout-bits";
import { FindingListItem } from "@/components/projects/project-bits";
import type { FindingWithProject } from "@/lib/projects/data";
import { awaitingClient, isChangeCategory, needsReview } from "@/lib/projects/meta";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "review", label: "Needs review", test: (f: FindingWithProject) => needsReview(f) },
  { key: "client", label: "Awaiting client", test: (f: FindingWithProject) => awaitingClient(f) },
  { key: "changes", label: "All changes", test: (f: FindingWithProject) => isChangeCategory(f.category) && f.review_status !== "dismissed" },
  { key: "commitments", label: "Commitments", test: (f: FindingWithProject) => f.category === "commitment" && f.review_status !== "dismissed" },
  { key: "all", label: "Everything", test: () => true },
] as const;

export function FindingsBrowser({ findings }: { findings: FindingWithProject[] }) {
  const [active, setActive] = useState<(typeof FILTERS)[number]["key"]>(findings.some(needsReview) ? "review" : "all");
  const filter = FILTERS.find((f) => f.key === active)!;
  const shown = findings.filter(filter.test);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const count = findings.filter(f.test).length;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setActive(f.key)}
              aria-pressed={active === f.key}
              className={cn(
                "shrink-0 rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-colors",
                active === f.key ? "border-ink bg-dawn" : "border-cream-dark bg-paper text-ink/70 hover:border-ink/40",
              )}
            >
              {f.label} <span className="font-mono text-xs text-ink-muted">{count}</span>
            </button>
          );
        })}
      </div>
      {shown.length === 0 ? (
        <EmptyState icon={<ListChecks />} title="Nothing here." body="Findings from your conversations appear here, each with the exact words that were said." />
      ) : (
        <ul className="surface divide-y-2 divide-cream-dark">
          {shown.map((f) => (
            <FindingListItem
              key={f.id}
              f={f}
              href={`/projects/${f.project.id}/conversations/${f.conversation_id}?finding=${f.id}`}
              context={`${f.project.name} · ${f.conversation.title}`}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
