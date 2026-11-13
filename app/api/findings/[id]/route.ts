import { z } from "zod";
import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";

const Patch = z
  .object({
    category: z.enum(["potential_scope_addition", "scope_modification", "existing_scope", "clarification_needed", "commitment", "idea"]),
    review_status: z.enum(["ai_detected", "reviewed", "dismissed"]),
    client_status: z.enum(["not_sent", "sent", "approved", "rejected"]),
    notes: z.string().max(4000).nullable(),
    client_message: z.string().max(8000).nullable(),
  })
  .partial()
  .strict();

/**
 * Review a finding: correct its classification, add notes, mark it reviewed or
 * dismissed, and record what the client did. The client's answer is only ever
 * recorded here by the freelancer, and only after they've reviewed the finding.
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/findings/[id]">) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  const { id } = await ctx.params;

  const parsed = Patch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid update.");
  const patch = parsed.data;

  const { data: current } = await auth.supabase.from("findings").select("review_status,client_status").eq("id", id).maybeSingle();
  if (!current) return jsonError(404, "Not found.");

  const nextReview = patch.review_status ?? current.review_status;
  const nextClient = patch.client_status ?? current.client_status;
  if (nextClient !== "not_sent" && nextReview !== "reviewed") {
    return jsonError(409, "Review the finding before recording what the client did.");
  }
  // Un-reviewing or dismissing resets the client track so nothing stale stays "approved".
  if (patch.review_status && patch.review_status !== "reviewed" && patch.client_status === undefined) patch.client_status = "not_sent";

  const { error } = await auth.supabase
    .from("findings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return jsonError(500, "Couldn't save the change.");
  return Response.json({ ok: true });
}
