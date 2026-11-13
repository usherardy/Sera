import { z } from "zod";
import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";

const Patch = z
  .object({
    title: z.string().trim().min(1).max(200),
    owner: z.string().trim().max(80).nullable(),
    due_date: z.iso.date().nullable(),
    status: z.enum(["open", "done"]),
  })
  .partial()
  .strict();

export async function PATCH(request: Request, ctx: RouteContext<"/api/tasks/[id]">) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  const { id } = await ctx.params;

  const parsed = Patch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid update.");

  const { data, error } = await auth.supabase.from("follow_up_tasks").update(parsed.data).eq("id", id).select("id").maybeSingle();
  if (error) return jsonError(500, "Couldn't save the change.");
  if (!data) return jsonError(404, "Not found.");
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/tasks/[id]">) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  const { id } = await ctx.params;

  const { data, error } = await auth.supabase.from("follow_up_tasks").delete().eq("id", id).select("id").maybeSingle();
  if (error) return jsonError(500, "Couldn't delete the task.");
  if (!data) return jsonError(404, "Not found.");
  return Response.json({ ok: true });
}
