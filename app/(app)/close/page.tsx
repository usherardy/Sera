import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CloseDayFlow } from "@/components/close/close-day-flow";
import { getDay, getViewer } from "@/lib/data";
import { byMomentTime, rankMoments } from "@/lib/ranking";

/** How many of the day's moments the ritual asks about. Keeps it to about a minute. */
const MOMENTS_TO_REVIEW = 3;

export default function CloseDayPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
          <Skeleton className="h-6 w-40 bg-cream-dark/60" />
          <Skeleton className="h-96 rounded-card bg-cream-dark/60" />
        </div>
      }
    >
      <CloseDayContent />
    </Suspense>
  );
}

async function CloseDayContent() {
  const viewer = await getViewer();
  const day = await getDay(viewer.today);
  const moments = rankMoments(day.moments, MOMENTS_TO_REVIEW).sort(byMomentTime);
  const commitments = day.commitments.filter((c) => c.approval_status !== "dismissed");
  return <CloseDayFlow commitments={commitments} moments={moments} tz={viewer.timezone} />;
}
