import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";
import { runAnalysis } from "@/lib/projects/run-analysis";

export const maxDuration = 60;

/** (Re)run the analysis for one conversation. Reviewed findings are kept. */
export async function POST(_request: Request, ctx: RouteContext<"/api/conversations/[id]/analyze">) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  const { id } = await ctx.params;

  const result = await runAnalysis(auth.supabase, auth.userId, id);
  if (result.ok) return Response.json({ ok: true, findings: result.findings });
  if (result.status === "not_found") return jsonError(404, result.error);
  if (result.status === "busy") return jsonError(409, result.error);
  return jsonError(502, result.error);
}
