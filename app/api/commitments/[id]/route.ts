import { z } from "zod";
import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";

const Patch = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(2000).nullable(),
    owner_label: z.string().trim().max(80).nullable(),
    due_date: z.iso.date().nullable(),
    due_time: z.string().regex(/^[0-2]\d:[0-5]\d$/).nullable(),
    all_day: z.boolean(),
    approval_status: z.enum(["pending", "approved", "dismissed"]),
    completion_status: z.enum(["open", "done"]),
  })
  .partial()
  .strict();

/** Edit, approve, dismiss or complete a commitment. RLS limits this to the owner's rows. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/commitments/[id]">) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  const { id } = await ctx.params;

  const parsed = Patch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid update.");
  const patch = parsed.data;
  if (patch.due_date === null) patch.due_time = null; // a time needs a date

  const { data, error } = await auth.supabase
    .from("commitments")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return jsonError(500, "Couldn't save the change.");
  if (!data) return jsonError(404, "Not found.");
  return Response.json({ ok: true });
}
