import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SampleBadge } from "@/components/common/badges";
import { AnalyzeButton } from "@/components/projects/analyze-button";
import { ConversationWorkspace } from "@/components/projects/conversation-workspace";
import { ProcessingLine } from "@/components/projects/project-bits";
import { getViewer } from "@/lib/viewer";
import { formatClock, formatDayHeading, localDateOf } from "@/lib/format";
import { getConversation } from "@/lib/projects/data";

export default function ConversationPage({ params, searchParams }: PageProps<"/projects/[id]/conversations/[conversationId]">) {
  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-card bg-cream-dark/60" />}>
        <ConversationContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ConversationContent({
  params,
  searchParams,
}: {
  params: PageProps<"/projects/[id]/conversations/[conversationId]">["params"];
  searchParams: PageProps<"/projects/[id]/conversations/[conversationId]">["searchParams"];
}) {
  const { id, conversationId } = await params;
  const { finding } = await searchParams;
  const [data, viewer] = await Promise.all([getConversation(id, conversationId), getViewer()]);
  if (!data) notFound();
  const { project, conversation: c, findings, tasks } = data;

  return (
    <>
      <Link href={`/projects/${project.id}`} className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink/70 hover:text-ink">
        <ArrowLeft className="size-4" />
        {project.name}
      </Link>

      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="eyebrow">
            {formatDayHeading(localDateOf(c.recorded_at, viewer.timezone))} · {formatClock(c.recorded_at, viewer.timezone)}
          </span>
          <ProcessingLine status={c.processing_status} />
          {c.is_sample && <SampleBadge />}
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="display text-[2.4rem] sm:text-5xl">{c.title}</h1>
          <AnalyzeButton conversationId={c.id} status={c.processing_status} />
        </div>
        {c.summary && <p className="max-w-3xl text-base text-ink-muted sm:text-lg">{c.summary}</p>}
      </header>

      {c.processing_status === "failed" && (
        <div className="flex items-start gap-3 rounded-card bg-error-bg p-4 text-pulse">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">We couldn&apos;t analyze this conversation.</p>
            {c.error_message && <p className="mt-1 text-sm">{c.error_message}</p>}
          </div>
        </div>
      )}
      {c.processing_status === "pending" && (
        <p className="rounded-card bg-warning px-4 py-3 text-sm font-semibold text-warning-dark">
          This conversation hasn&apos;t been analyzed yet. Press Analyze to compare it with the original agreement.
        </p>
      )}

      <ConversationWorkspace
        transcript={c.transcript}
        findings={findings}
        project={project}
        tasks={tasks}
        initialFindingId={typeof finding === "string" ? finding : null}
      />
    </>
  );
}
