import { z } from "zod";
import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";

const Patch = z
  .object({
    dismissed: z.boolean(),
    title: z.string().trim().min(1).max(200),
    summary: z.string().trim().min(1).max(1000),
  })
  .partial()
  .strict();

/** Dismiss (or restore) or correct a moment. RLS limits this to the owner's rows. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/moments/[id]">) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  const { id } = await ctx.params;

  const parsed = Patch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid update.");

  const { data, error } = await auth.supabase.from("moments").update(parsed.data).eq("id", id).select("id").maybeSingle();
  if (error) return jsonError(500, "Couldn't save the change.");
  if (!data) return jsonError(404, "Not found.");
  return Response.json({ ok: true });
}
