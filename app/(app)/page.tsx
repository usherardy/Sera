import { redirect } from "next/navigation";

// SERA is a project-based scope-protection tool: Projects is home.
export default function HomePage() {
  redirect("/projects");
}
