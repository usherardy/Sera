import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/layout-bits";
import { ActionsBoard } from "@/components/actions/actions-board";
import { getViewer, listCommitments } from "@/lib/data";

export default function ActionsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Actions"
        title={
          <>
            What you <em>promised</em>.
          </>
        }
        subtitle="Commitments found in your recordings. Nothing leaves FollowThrough until you approve it."
      />
      <Suspense
        fallback={
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full max-w-md rounded-xl bg-cream-dark/60" />
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-48 rounded-card bg-cream-dark/60" />
            ))}
          </div>
        }
      >
        <ActionsContent />
      </Suspense>
    </div>
  );
}

async function ActionsContent() {
  const viewer = await getViewer();
  const commitments = await listCommitments();
  return <ActionsBoard commitments={commitments} tz={viewer.timezone} />;
}
