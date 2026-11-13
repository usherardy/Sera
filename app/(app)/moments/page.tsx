import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/layout-bits";
import { MomentList } from "@/components/moments/moment-list";
import { getViewer, listMoments } from "@/lib/data";

export default function MomentsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Moments"
        title={
          <>
            What <em>mattered</em>.
          </>
        }
        subtitle="Decisions, commitments and important information, each tied to what was actually said."
      />
      <Suspense
        fallback={
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-44 rounded-card bg-cream-dark/60" />
            ))}
          </div>
        }
      >
        <MomentsContent />
      </Suspense>
    </div>
  );
}

async function MomentsContent() {
  const viewer = await getViewer();
  const moments = await listMoments();
  return <MomentList moments={moments} tz={viewer.timezone} variant="timeline" showFilters />;
}
