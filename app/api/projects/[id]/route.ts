import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";
import { ProjectInput } from "@/lib/projects/schemas";

/** Explicitly edit the original agreement. This is the only path that changes it. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  const { id } = await ctx.params;

  const parsed = ProjectInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid project.");

  const { data, error } = await auth.supabase
    .from("projects")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return jsonError(500, "Couldn't save the agreement.");
  if (!data) return jsonError(404, "Not found.");
  return Response.json({ ok: true });
}

/** Delete a project and everything under it (conversations, findings, tasks cascade). */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  const { id } = await ctx.params;

  const { data, error } = await auth.supabase.from("projects").delete().eq("id", id).select("id").maybeSingle();
  if (error) return jsonError(500, "Couldn't delete the project.");
  if (!data) return jsonError(404, "Not found.");
  return Response.json({ ok: true });
}
