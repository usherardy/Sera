import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SampleBadge, StatusLine } from "@/components/common/badges";
import { SectionHeader } from "@/components/common/layout-bits";
import { KindLabel } from "@/components/memory/recording-card";
import { RecordingWorkspace } from "@/components/memory/recording-workspace";
import { DeleteRecording } from "@/components/memory/delete-recording";
import { MomentList } from "@/components/moments/moment-list";
import { ActionsBoard } from "@/components/actions/actions-board";
import { getRecording, getViewer } from "@/lib/data";
import { formatClock, formatDayHeading, formatDuration, localDateOf } from "@/lib/format";

export default function RecordingPage({ params, searchParams }: PageProps<"/memory/[id]">) {
  return (
    <div className="flex flex-col gap-8">
      <Link href="/memory" className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink/70 hover:text-ink">
        <ArrowLeft className="size-4" />
        Memory
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <RecordingContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function RecordingContent({
  params,
  searchParams,
}: {
  params: PageProps<"/memory/[id]">["params"];
  searchParams: PageProps<"/memory/[id]">["searchParams"];
}) {
  const { id } = await params;
  const { t } = await searchParams;
  const viewer = await getViewer();
  const data = await getRecording(id);
  if (!data) notFound();
  const { recording: r, moments, commitments } = data;
  const initialMs = typeof t === "string" && /^\d+$/.test(t) ? Number(t) : null;
  const evidence = [...moments, ...commitments].map((x) => x.evidence_text);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="eyebrow">
            {formatDayHeading(localDateOf(r.recorded_at, viewer.timezone))} · {formatClock(r.recorded_at, viewer.timezone)} ·{" "}
            {formatDuration(r.duration_seconds)}
          </span>
          <KindLabel kind={r.kind} />
          <StatusLine status={r.status} />
          {r.is_sample && <SampleBadge />}
        </div>
        <h1 className="display text-[2.6rem] sm:text-6xl">{r.title}</h1>
      </header>

      {r.status === "failed" && (
        <div className="flex items-start gap-3 rounded-card bg-error-bg p-4 text-pulse">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">We couldn&apos;t process this recording. Try again.</p>
            {r.error_message && <p className="mt-1 text-sm">{r.error_message}</p>}
          </div>
        </div>
      )}

      {r.summary && (
        <section className="surface flex flex-col gap-4 p-5 sm:p-7">
          <p className="eyebrow">Summary</p>
          <p className="font-serif text-2xl leading-snug sm:text-[1.75rem]">{r.summary}</p>
          {r.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {r.topics.map((t) => (
                <span key={t} className="rounded-full bg-secondary px-3 py-1 text-sm font-medium">
                  {t}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        <section className="flex min-w-0 flex-col gap-5">
          <SectionHeader title={<>Moments</>} count={moments.length} />
          <MomentList moments={moments} tz={viewer.timezone} compact emptyTitle="No important moments in this recording." />
        </section>
        <section className="flex min-w-0 flex-col gap-5">
          <SectionHeader title={<>Commitments</>} count={commitments.length} />
          <ActionsBoard commitments={commitments} tz={viewer.timezone} mode="preview" limit={20} />
        </section>
      </div>

      <RecordingWorkspace
        audioUrl={r.audio_url}
        durationSeconds={r.duration_seconds}
        segments={r.segments}
        evidence={evidence}
        initialMs={initialMs}
      />

      <div className="border-t-2 border-cream-dark pt-6">
        <DeleteRecording recordingId={r.id} title={r.title} />
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-64 bg-cream-dark/60" />
      <Skeleton className="h-16 w-full max-w-lg bg-cream-dark/60" />
      <Skeleton className="h-40 rounded-card bg-cream-dark/60" />
      <Skeleton className="h-64 rounded-card bg-cream-dark/60" />
    </div>
  );
}
