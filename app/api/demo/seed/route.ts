import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";
import { SeedError, seedDemoData } from "@/lib/sample/seed";

/**
 * Load the clearly labeled demo data (see lib/sample/seed.ts). Every row is
 * is_sample = true and shows a Sample badge; "Re-run analysis" on a sample
 * conversation replaces its example findings with real AI output.
 * Loading again replaces the previous demo data.
 */
export async function POST() {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  try {
    const id = await seedDemoData(auth.supabase);
    return Response.json({ id }, { status: 201 });
  } catch (e) {
    return jsonError(500, e instanceof SeedError ? e.message : "Couldn't load the demo data.");
  }
}

/** Remove all demo data (conversations, findings and tasks cascade). */
export async function DELETE() {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  const { error } = await auth.supabase.from("projects").delete().eq("is_sample", true);
  if (error) return jsonError(500, "Couldn't remove the demo data.");
  return Response.json({ ok: true });
}
