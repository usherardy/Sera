import { cn } from "@/lib/utils";
import { CATEGORY_META } from "@/lib/categories";
import { formatDateOnly, formatOwner } from "@/lib/format";
import type { Confidence, MomentCategory, RecordingStatus } from "@/lib/types";
import { AlertTriangle, CalendarDays, Loader2, User, UserRoundX } from "lucide-react";

export function CategoryBadge({
  category,
  className,
}: {
  category: MomentCategory;
  className?: string;
}) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        meta.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      title="Clearly labeled sample data, not your real history"
      className={cn(
        "inline-flex items-center rounded-full border border-ink/20 bg-warning px-2 py-0.5 font-mono text-[0.65rem] font-medium tracking-wider text-warning-dark uppercase",
        className,
      )}
    >
      Sample
    </span>
  );
}

const STATUS_COPY: Record<RecordingStatus, string> = {
  uploaded: "Queued…",
  transcribing: "Transcribing…",
  analyzing: "Finding moments…",
  completed: "Processed",
  failed: "Couldn't process",
};

export function StatusLine({ status }: { status: RecordingStatus }) {
  if (status === "completed") return null;
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-pulse">
        <AlertTriangle className="size-3.5" />
        {STATUS_COPY[status]}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple">
      <Loader2 className="size-3.5 animate-spin" />
      {STATUS_COPY[status]}
    </span>
  );
}

export function OwnerChip({ owner }: { owner: string | null }) {
  const unassigned = !owner;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
        unassigned ? "bg-warning text-warning-dark" : "bg-secondary text-ink",
      )}
    >
      {unassigned ? <UserRoundX className="size-3.5" /> : <User className="size-3.5" />}
      {formatOwner(owner)}
    </span>
  );
}

export function DueChip({
  dueDate,
  duePhrase,
}: {
  dueDate: string | null;
  duePhrase?: string | null;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
        dueDate ? "bg-dawn/60 text-ink" : "bg-secondary text-ink-muted",
      )}
      title={duePhrase ? `Said: “${duePhrase}”` : undefined}
    >
      <CalendarDays className="size-3.5" />
      {dueDate ? formatDateOnly(dueDate) : "No deadline"}
    </span>
  );
}

const CONFIDENCE_BARS: Record<Confidence, number> = { low: 1, medium: 2, high: 3 };

export function ConfidenceMeter({ confidence }: { confidence: Confidence }) {
  const n = CONFIDENCE_BARS[confidence];
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[0.7rem] text-ink-muted uppercase"
      title={`${confidence} confidence`}
    >
      <span className="flex items-end gap-0.5">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn("w-1 rounded-sm", i <= n ? "bg-ink" : "bg-cream-dark")}
            style={{ height: 4 + i * 3 }}
          />
        ))}
      </span>
      {confidence === "low" ? "Unsure" : confidence}
    </span>
  );
}
