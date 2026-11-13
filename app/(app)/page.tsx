import { Suspense } from "react";
import { CheckSquare, Mic, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, SectionHeader } from "@/components/common/layout-bits";
import { CaptureCta, Greeting, StatCard } from "@/components/home/home-bits";
import { DailyMemoryCard } from "@/components/home/daily-memory-card";
import { MomentList } from "@/components/moments/moment-list";
import { ActionsBoard } from "@/components/actions/actions-board";
import { CloseDayCard } from "@/components/close/close-day-card";
import { getDay, getViewer } from "@/lib/data";
import { formatDayHeading } from "@/lib/format";
import { byMomentTime, rankMoments } from "@/lib/ranking";

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const viewer = await getViewer();
  const day = await getDay(viewer.today);
  const pending = day.commitments.filter((c) => c.approval_status === "pending");
  const open = day.commitments.filter((c) => c.approval_status !== "dismissed" && c.completion_status === "open");
  const top = rankMoments(day.moments, 3).sort(byMomentTime);
  const isSample = day.recordings.some((r) => r.is_sample);

  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <header className="flex flex-col gap-6 pt-2 sm:flex-row sm:items-end sm:justify-between animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-col gap-4">
          <p className="eyebrow">{formatDayHeading(day.date)}</p>
          <h1 className="display text-[2.9rem] sm:text-7xl">
            <Greeting tz={viewer.timezone} />
            <br />
            Here&apos;s what <em>mattered</em> today.
          </h1>
        </div>
        <div className="hidden sm:block">
          <CaptureCta />
        </div>
      </header>

      <section className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <StatCard value={day.recordings.length} label="Recordings today" icon={<Mic />} />
        <StatCard value={day.moments.length} label="Important moments" icon={<Sparkles />} />
        <StatCard value={pending.length} label="Pending commitments" icon={<CheckSquare />} />
      </section>

      {day.recordings.length > 0 && (
        <CloseDayCard promises={pending.length} moments={Math.min(3, day.moments.length)} />
      )}

      {day.recordings.length === 0 ? (
        <EmptyState
          icon={<Mic />}
          title="Start capturing your first moment."
          body="Record a conversation or upload a voice memo. SERA will summarize it and pull out what matters."
          action={<CaptureCta />}
          className="py-14"
        />
      ) : (
        day.summary && <DailyMemoryCard summary={day.summary} sample={isSample} />
      )}

      {day.recordings.length > 0 && (
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
          <section className="flex min-w-0 flex-col gap-5">
            <SectionHeader
              title={
                <>
                  Important <em>moments</em>
                </>
              }
              href="/moments"
            />
            <MomentList moments={top} tz={viewer.timezone} compact />
          </section>
          <section className="flex min-w-0 flex-col gap-5">
            <SectionHeader
              title={
                <>
                  Follow-<em>through</em>
                </>
              }
              href="/actions"
              linkLabel={pending.length ? `Review ${pending.length}` : "All tasks"}
            />
            <ActionsBoard commitments={open} tz={viewer.timezone} mode="preview" limit={3} />
          </section>
        </div>
      )}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4 pt-2">
        <Skeleton className="h-4 w-48 bg-cream-dark/60" />
        <Skeleton className="h-28 w-full max-w-xl bg-cream-dark/60" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-32 rounded-card bg-cream-dark/60" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-[2rem] bg-cream-dark/60" />
    </div>
  );
}
