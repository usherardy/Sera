import type { Metadata } from "next";
import { LandingOverview } from "@/components/marketing/landing-overview";
import { LandingWalkthrough } from "@/components/marketing/landing-walkthrough";
import { LANDING_VERSION } from "@/lib/landing";

export const metadata: Metadata = {
  title: "Sera · Change requests on autopilot",
  description: "Sera listens to your client calls, spots every request outside the agreed scope, and turns it into a change request your client can approve.",
};

/** The live landing page. Pick the version in lib/landing.ts. */
export default function WelcomePage() {
  return LANDING_VERSION === "walkthrough" ? <LandingWalkthrough /> : <LandingOverview />;
}
