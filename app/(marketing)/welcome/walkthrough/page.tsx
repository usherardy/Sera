import type { Metadata } from "next";
import { LandingWalkthrough } from "@/components/marketing/landing-walkthrough";

export const metadata: Metadata = { title: "Sera · Change requests on autopilot" };

/** Preview of the walkthrough landing page (version A). */
export default function WalkthroughPreview() {
  return <LandingWalkthrough />;
}
