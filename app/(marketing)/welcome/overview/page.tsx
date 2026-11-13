import type { Metadata } from "next";
import { LandingOverview } from "@/components/marketing/landing-overview";

export const metadata: Metadata = { title: "Sera · Change requests on autopilot" };

/** Preview of the overview landing page (version B). */
export default function OverviewPreview() {
  return <LandingOverview />;
}
