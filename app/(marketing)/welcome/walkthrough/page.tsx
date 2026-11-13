import type { Metadata } from "next";
import { LandingWalkthrough } from "@/components/marketing/landing-walkthrough";

export const metadata: Metadata = { title: "Sera · Stop doing free work" };

/** Preview of the walkthrough landing page (version A). */
export default function WalkthroughPreview() {
  return <LandingWalkthrough />;
}
