import { z } from "zod";
import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";

const Body = z.object({
  project_id: z.uuid(),
  finding_id: z.uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200),
  owner: z.string().trim().max(80).nullable().optional(),
  due_date: z.iso.date().nullable().optional(),
});

/** Create a follow-up task on a project (optionally tied to a finding). */
export async function POST(request: Request) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid task.");
  const body = parsed.data;

  // RLS hides other people's projects/findings, so a missing row means "not yours".
  const { data: project } = await auth.supabase.from("projects").select("id").eq("id", body.project_id).maybeSingle();
  if (!project) return jsonError(404, "Project not found.");
  if (body.finding_id) {
    const { data: finding } = await auth.supabase.from("findings").select("id").eq("id", body.finding_id).eq("project_id", body.project_id).maybeSingle();
    if (!finding) return jsonError(404, "Finding not found.");
  }

  const { data, error } = await auth.supabase
    .from("tasks")
    .insert({ project_id: body.project_id, finding_id: body.finding_id ?? null, title: body.title, owner: body.owner || null, due_date: body.due_date ?? null })
    .select("id")
    .single();
  if (error || !data) return jsonError(500, "Couldn't create the task.");
  return Response.json({ id: data.id }, { status: 201 });
}
