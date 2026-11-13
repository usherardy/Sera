import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";
import { ProjectInput } from "@/lib/projects/schemas";

/** Create a project with its original agreement. RLS stamps/limits it to the signed-in user. */
export async function POST(request: Request) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();

  const parsed = ProjectInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid project.");

  const { data, error } = await auth.supabase.from("projects").insert(parsed.data).select("id").single();
  if (error || !data) return jsonError(500, "Couldn't create the project.");
  return Response.json({ id: data.id }, { status: 201 });
}
