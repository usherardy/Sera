import { z } from "zod";
import { askSera, loadAskData } from "@/lib/ask/ask";
import { overAskLimit } from "@/lib/ask/limit";
import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";
import { isValidTimeZone, todayIn } from "@/lib/dates";
import { DEFAULT_TZ } from "@/lib/format";
import { AIError } from "@/lib/projects/openai";

export const maxDuration = 60;

const Body = z.object({
  question: z.string().trim().min(2).max(500),
  /** ask about one project only; omitted = all of your clients */
  project_id: z.uuid().nullable().optional(),
});

/**
 * Ask Sera a question about your clients. Read-only: answers come from stored
 * agreements, calls, findings and tasks; email requests return a draft.
 */
export async function POST(request: Request) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Ask a question of up to 500 characters.");
  if (overAskLimit(auth.userId)) return jsonError(429, "That's a lot of questions. Wait a few minutes and try again.");

  const { data: profile } = await auth.supabase.from("profiles").select("timezone").eq("id", auth.userId).maybeSingle();
  const timezone = profile?.timezone && isValidTimeZone(profile.timezone) ? profile.timezone : DEFAULT_TZ;
  const projectId = parsed.data.project_id ?? null;

  try {
    const data = await loadAskData(auth.supabase, projectId);
    if (projectId && data.projects.length === 0) return jsonError(404, "That project wasn't found.");
    const answer = await askSera(data, { question: parsed.data.question, today: todayIn(timezone), timezone, scopedProject: !!projectId });
    return Response.json(answer);
  } catch (e) {
    return jsonError(502, e instanceof AIError ? e.message : "Sera couldn't answer that. Try again.");
  }
}
