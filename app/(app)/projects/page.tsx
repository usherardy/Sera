import Link from "next/link";
import { Mic } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Suspense } from "react";
import { AlertCircle, CheckSquare, FolderKanban, ListChecks } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader, SectionHeader } from "@/components/common/layout-bits";
import { StatCard } from "@/components/common/stat-card";
import { NewProjectButton } from "@/components/projects/project-form-dialog";
import { ProcessingLine, ProjectCard } from "@/components/projects/project-bits";
import { listProjects, listRecentConversations } from "@/lib/projects/data";
import { SUPABASE_ENABLED } from "@/lib/supabase/config";
import { formatDayHeading, localDateOf } from "@/lib/format";
import { getViewer } from "@/lib/viewer";

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      <PageHeader
        eyebrow="Scope protection"
        title={
          <>
            Your <em>projects</em>
          </>
        }
        subtitle="SERA creates a project the first time you record a call with a new client. Each one keeps the original agreement that later calls are compared against."
        action={
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            <Mic />
            Record a call
          </Link>
        }
      />
      {SUPABASE_ENABLED ? (
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      ) : (
        <div className="flex items-start gap-3 rounded-card bg-warning p-4 text-warning-dark">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <p className="text-sm font-semibold">Supabase isn&apos;t configured, so projects can&apos;t be saved. Add the Supabase keys to .env.local.</p>
        </div>
      )}
    </div>
  );
}

async function DashboardContent() {
  const [projects, recent, viewer] = await Promise.all([listProjects(), listRecentConversations(5), getViewer()]);
  const pending = projects.reduce((n, p) => n + p.pending_changes, 0);
  const tasks = projects.reduce((n, p) => n + p.open_tasks, 0);

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<Mic />}
        title="Record your first call."
        body="Press record during a client call. SERA works out who the client is, sets up the project from what was said, and flags anything beyond the agreement."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/" className={buttonVariants()}>
              <Mic />
              Record a call
            </Link>
            <NewProjectButton variant="ghost" label="Set one up by hand" />
          </div>
        }
        className="py-14"
      />
    );
  }

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      <section className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <StatCard value={projects.length} label="Active projects" icon={<FolderKanban />} />
        <StatCard value={pending} label="Changes to review" icon={<ListChecks />} />
        <StatCard value={tasks} label="Open follow-ups" icon={<CheckSquare />} />
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader title="Projects" count={projects.length} />
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="flex flex-col gap-5">
          <SectionHeader title="Recent activity" />
          <ul className="surface divide-y divide-cream-dark">
            {recent.map(({ conversation: c, project }) => (
              <li key={c.id}>
                <Link
                  href={`/projects/${project.id}/conversations/${c.id}`}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 p-4 transition-colors hover:bg-cream/60"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{c.title}</span>
                    <span className="eyebrow">
                      {project.name} · {formatDayHeading(localDateOf(c.recorded_at, viewer.timezone))}
                    </span>
                  </span>
                  <ProcessingLine status={c.processing_status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-card bg-cream-dark/60" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-card bg-cream-dark/60" />
    </div>
  );
}
