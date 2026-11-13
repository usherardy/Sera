import Link from "next/link";
import { MessagesSquare, NotebookPen } from "lucide-react";
import { SampleBadge, StatusLine } from "@/components/common/badges";
import { formatClock, formatDuration } from "@/lib/format";
import type { Recording } from "@/lib/types";

export function KindLabel({ kind }: { kind: Recording["kind"] }) {
  const Icon = kind === "voice_note" ? NotebookPen : MessagesSquare;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
      <Icon className="size-3.5" />
      {kind === "voice_note" ? "Voice note" : "Conversation"}
    </span>
  );
}

export function RecordingCard({ recording: r, tz }: { recording: Recording; tz: string }) {
  return (
    <Link
      href={`/memory/${r.id}`}
      className="surface group flex flex-col gap-3 p-4 transition-colors hover:border-ink/30 sm:flex-row sm:gap-6 sm:p-5"
    >
      <div className="flex shrink-0 items-center gap-3 sm:w-24 sm:flex-col sm:items-start sm:gap-1">
        <span className="font-mono text-sm text-ink">{formatClock(r.recorded_at, tz)}</span>
        <span className="font-mono text-xs text-ink-muted">{formatDuration(r.duration_seconds)}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <KindLabel kind={r.kind} />
          <StatusLine status={r.status} />
          {r.is_sample && <SampleBadge className="ml-auto" />}
        </div>
        <h3 className="font-serif text-2xl leading-tight group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
          {r.title}
        </h3>
        {r.status === "failed" ? (
          <p className="text-sm text-pulse">{r.error_message ?? "We couldn't process this recording. Try again."}</p>
        ) : (
          r.summary && <p className="line-clamp-2 text-[0.9375rem] text-ink/75">{r.summary}</p>
        )}
        {r.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {r.topics.map((t) => (
              <span key={t} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-ink/75">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
