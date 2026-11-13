import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/layout-bits";
import { FindingsBrowser } from "@/components/projects/findings-browser";
import { listAllFindings } from "@/lib/projects/data";

export default function FindingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Across all projects"
        title={
          <>
            Every <em>finding</em>
          </>
        }
        subtitle="Possible additions, changes, open questions and promises from all your client conversations, each with its evidence."
      />
      <Suspense fallback={<Skeleton className="h-96 rounded-card bg-cream-dark/60" />}>
        <FindingsContent />
      </Suspense>
    </div>
  );
}

async function FindingsContent() {
  const findings = await listAllFindings();
  return <FindingsBrowser findings={findings} />;
}
