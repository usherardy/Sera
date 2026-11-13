import Link from "next/link";
import { Suspense } from "react";
import { Mic } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader } from "@/components/common/layout-bits";
import { CaptureCta } from "@/components/home/home-bits";
import { RecordingCard } from "@/components/memory/recording-card";
import { getViewer, listRecordingsByDay } from "@/lib/data";
import { formatDateOnly, formatDayHeading } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function MemoryPage({ searchParams }: PageProps<"/memory">) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Memory"
        title={
          <>
            Your day, <em>remembered</em>.
          </>
        }
        subtitle="Every recording, summarized and searchable by day."
      />
      <Suspense fallback={<ListSkeleton />}>
        <MemoryContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function MemoryContent({ searchParams }: { searchParams: PageProps<"/memory">["searchParams"] }) {
  const { date } = await searchParams;
  const selected = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  const viewer = await getViewer();
  const days = await listRecordingsByDay();
  const shown = selected ? days.filter((d) => d.date === selected) : days;

  if (days.length === 0) {
    return (
      <EmptyState
        icon={<Mic />}
        title="Start capturing your first moment."
        body="Recordings you make or upload will appear here, grouped by day."
        action={<CaptureCta />}
        className="py-14"
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <DayChip href="/memory" active={!selected} label="All days" />
        {days.map((d) => (
          <DayChip
            key={d.date}
            href={`/memory?date=${d.date}`}
            active={selected === d.date}
            label={d.date === viewer.today ? "Today" : formatDateOnly(d.date)}
            count={d.recordings.length}
          />
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState title="No recordings on this day." body="Pick another day above." />
      ) : (
        shown.map((d) => (
          <section key={d.date} className="flex flex-col gap-3">
            <h2 className="eyebrow">{d.date === viewer.today ? `Today · ${formatDayHeading(d.date)}` : formatDayHeading(d.date)}</h2>
            <div className="flex flex-col gap-3">
              {d.recordings.map((r) => (
                <RecordingCard key={r.id} recording={r} tz={viewer.timezone} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function DayChip({ href, active, label, count }: { href: string; active: boolean; label: string; count?: number }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors",
        active ? "border-ink bg-dawn" : "border-cream-dark bg-paper text-ink/70 hover:text-ink",
      )}
    >
      {label}
      {count != null && <span className="font-mono text-xs text-ink-muted">{count}</span>}
    </Link>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-32 rounded-card bg-cream-dark/60" />
      ))}
    </div>
  );
}
