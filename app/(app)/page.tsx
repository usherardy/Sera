import { Suspense } from "react";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/common/layout-bits";
import { CaptureFlow } from "@/components/capture/capture-flow";
import { DemoAutoload } from "@/components/projects/demo-autoload";
import { ProjectCard } from "@/components/projects/project-bits";
import { listProjects } from "@/lib/projects/data";
import { SUPABASE_ENABLED } from "@/lib/supabase/config";
import { getViewer } from "@/lib/viewer";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <header className="flex flex-col items-center gap-4 pt-2 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
        <p className="eyebrow">Scope protection for freelancers</p>
        <h1 className="display text-[2.4rem] sm:text-[4.1rem]">
          What did the client <em>ask</em> for?
        </h1>
        <p className="max-w-xl text-base text-ink-muted sm:text-lg">
          Record the call. SERA compares it with what you originally agreed and shows you the exact words.
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

async function HomeContent() {
  const [viewer, projects] = await Promise.all([getViewer(), listProjects()]);
  return (
    <>
      <div className="mx-auto w-full max-w-2xl">
        <CaptureFlow userId={viewer.userId} />
      </div>
      {projects.length === 0 && <DemoAutoload />}
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
