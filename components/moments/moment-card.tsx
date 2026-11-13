import { CategoryBadge, SampleBadge } from "@/components/common/badges";
import { CATEGORY_META } from "@/lib/categories";
import { formatMomentClock } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Moment, WithSource } from "@/lib/types";

export function MomentCard({
  moment,
  tz,
  compact = false,
  onOpen,
}: {
  moment: Moment & WithSource;
  tz: string;
  compact?: boolean;
  onOpen?: () => void;
}) {
  const time = formatMomentClock(moment.recording.recorded_at, moment.start_ms, tz);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "surface group flex w-full flex-col gap-3 p-4 text-left transition-colors hover:border-ink/30 sm:p-5",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge category={moment.category} />
        <span className="font-mono text-xs text-ink-muted">{time ?? "Time unavailable"}</span>
        {moment.is_sample && <SampleBadge className="ml-auto" />}
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-serif text-2xl leading-tight">{moment.title}</h3>
        <p className={cn("text-[0.9375rem] text-ink/80", compact && "line-clamp-2")}>{moment.summary}</p>
      </div>
      {!compact && (
        <p className="flex gap-2 text-sm text-ink-muted">
          <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", CATEGORY_META[moment.category].dot)} />
          <span>
            <span className="font-semibold text-ink">Why it matters: </span>
            {moment.importance_reason}
          </span>
        </p>
      )}
      <p className="eyebrow truncate group-hover:text-ink">From {moment.recording.title}</p>
    </button>
  );
}
