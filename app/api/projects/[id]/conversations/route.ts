import { z } from "zod";
import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";
import { runAnalysis } from "@/lib/projects/run-analysis";

// Analysis runs inside this request (transcripts are short), so allow time.
export const maxDuration = 60;

const Body = z.object({
  title: z.string().trim().min(1).max(160),
  transcript: z.string().trim().min(1, "The transcript is empty.").max(60_000, "That transcript is too long (60,000 characters max)."),
  source: z.enum(["paste", "upload", "recording"]),
  recorded_at: z.iso.datetime({ offset: true }).optional(),
});

/** Add a conversation to a project and analyze it against the original agreement. */
export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/conversations">) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  const { id: projectId } = await ctx.params;

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid conversation.");
  const body = parsed.data;

  const { data: project } = await auth.supabase.from("projects").select("id").eq("id", projectId).maybeSingle();
  if (!project) return jsonError(404, "Project not found.");

  // The same transcript twice in one project is a duplicate upload: reuse the first.
  const { data: dup } = await auth.supabase
    .from("conversations")
    .select("id")
    .eq("project_id", projectId)
    .eq("transcript", body.transcript)
    .limit(1)
    .maybeSingle();
  if (dup) return Response.json({ id: dup.id, duplicate: true, status: "existing" });

  const { data: created, error } = await auth.supabase
    .from("conversations")
    .insert({
      project_id: projectId,
      title: body.title,
      transcript: body.transcript,
      source: body.source,
      ...(body.recorded_at ? { recorded_at: body.recorded_at } : {}),
    })
    .select("id")
    .single();
  if (error || !created) return jsonError(500, "Couldn't save the conversation.");

  const result = await runAnalysis(auth.supabase, auth.userId, created.id);
  if (!result.ok) return Response.json({ id: created.id, status: "failed", error: result.error }, { status: 200 });
  return Response.json({ id: created.id, status: "completed", findings: result.findings }, { status: 201 });
}
