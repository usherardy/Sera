import { Suspense } from "react";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/common/layout-bits";
import { CaptureFlow } from "@/components/capture/capture-flow";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AskBar } from "@/components/ask/ask-bar";
import { DemoAutoload } from "@/components/projects/demo-autoload";
import type { ProjectSummary } from "@/lib/projects/types";
import { TodoList } from "@/components/projects/todo-list";
import { ProjectCard } from "@/components/projects/project-bits";
import { listProjects, listTodo } from "@/lib/projects/data";
import { SUPABASE_ENABLED } from "@/lib/supabase/config";
import { getViewer } from "@/lib/viewer";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <header className="flex flex-col items-center gap-4 pt-2 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
        <p className="eyebrow">Change requests on autopilot</p>
        <h1 className="display text-[2.7rem] sm:text-7xl">
          What did the client <em>ask</em> for?
        </h1>
        <p className="max-w-xl text-base text-ink-muted sm:text-lg">
          Record the call. Sera compares it with what you originally agreed and shows you the exact words.
        </p>
      </header>
      {SUPABASE_ENABLED ? (
        <Suspense fallback={<Skeleton className="mx-auto size-44 rounded-full bg-cream-dark/60" />}>
          <HomeContent />
        </Suspense>
      ) : (
        <div className="flex items-start gap-3 rounded-card bg-warning p-4 text-warning-dark">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <p className="text-sm font-semibold">Supabase isn&apos;t configured, so nothing can be saved. Add the Supabase keys to .env.local.</p>
        </div>
      )}
    </div>
  );
}

/** Ready-made questions; the email one names the client with the most to review. */
function homeSuggestions(projects: ProjectSummary[]) {
  const busiest = [...projects].sort((a, b) => b.pending_changes - a.pending_changes)[0];
  return [
    "What deadlines are coming up?",
    "Was anything flagged in my last meeting?",
    `Draft an email to ${busiest.client_name} about the open changes`,
  ];
}

async function HomeContent() {
  const [viewer, projects, todo] = await Promise.all([getViewer(), listProjects(), listTodo()]);
  return (
    <>
      <div className="mx-auto w-full max-w-2xl">
        <CaptureFlow userId={viewer.userId} />
      </div>
      {projects.length > 0 && (
        <div className="mx-auto w-full max-w-2xl">
          <AskBar suggestions={homeSuggestions(projects)} />
        </div>
      )}
      {projects.length === 0 && <DemoAutoload />}
      {(todo.tasks.length > 0 || todo.review.length > 0) && (
        <section className="flex flex-col gap-5">
          <SectionHeader title={<>Up <em>next</em></>} href="/todo" linkLabel="Everything to do" />
          {todo.review.length > 0 && (
            <Link
              href="/todo"
              className="flex items-center justify-between gap-3 rounded-card bg-glow/15 px-4 py-3 text-sm font-semibold text-[#8a4d00] transition-colors hover:bg-glow/25"
            >
              {todo.review.length} possible change{todo.review.length === 1 ? "" : "s"} from your calls waiting for review
              <ArrowRight className="size-4 shrink-0" />
            </Link>
          )}
          {todo.tasks.length > 0 && <TodoList tasks={todo.tasks} today={viewer.today} limit={5} />}
        </section>
      )}
      {projects.length > 0 && (
        <section className="flex flex-col gap-5">
          <SectionHeader title="Your projects" count={projects.length} href="/projects" linkLabel="All projects" />
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.slice(0, 4).map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
