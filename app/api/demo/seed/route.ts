import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";
import { ACME_CONVERSATIONS, ACME_PROJECT } from "@/lib/sample/acme";

/**
 * Load the clearly labeled sample project (Acme Studio Website) into the
 * signed-in user's account. The conversations are added UNANALYZED so the demo
 * runs the real analysis live; nothing here is pre-computed AI output.
 * Loading again replaces the previous sample project.
 */
export async function POST() {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  const { supabase } = auth;

  const removed = await supabase.from("projects").delete().eq("is_sample", true);
  if (removed.error) return jsonError(500, "Couldn't replace the previous sample project.");

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ ...ACME_PROJECT, is_sample: true })
    .select("id")
    .single();
  if (error || !project) return jsonError(500, "Couldn't add the sample project.");

  const { error: convError } = await supabase.from("conversations").insert(
    ACME_CONVERSATIONS.map((c) => ({
      project_id: project.id,
      title: c.title,
      transcript: c.transcript,
      source: "paste",
      recorded_at: c.recorded_at,
      is_sample: true,
    })),
  );
  if (convError) {
    await supabase.from("projects").delete().eq("id", project.id);
    return jsonError(500, "Couldn't add the sample conversations.");
  }
  return Response.json({ id: project.id }, { status: 201 });
}

/** Remove the sample project and everything under it (findings and tasks cascade). */
export async function DELETE() {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  const { error } = await auth.supabase.from("projects").delete().eq("is_sample", true);
  if (error) return jsonError(500, "Couldn't remove the sample project.");
  return Response.json({ ok: true });
}
