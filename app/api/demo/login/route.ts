import { jsonError } from "@/lib/auth";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-account";
import { seedDemoData } from "@/lib/sample/seed";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_ENABLED } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * One-click demo: sign in to the shared demo account (lib/demo-account.ts),
 * creating it the first time this Supabase project sees it, and load the
 * labeled sample projects when the account has no projects. Sets the normal
 * session cookies, so the rest of the app works exactly as for any user.
 */
export async function POST() {
  if (!SUPABASE_ENABLED) return jsonError(503, "Sign-in isn't set up yet.");
  const supabase = await createClient();
  const signIn = () => supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });

  let { error } = await signIn();
  if (error?.code === "invalid_credentials") {
    // First use on this project: create the account, already confirmed (no email is sent).
    const { error: createError } = await createAdminClient().auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: "Demo", timezone: "Europe/Vilnius" },
    });
    if (createError && createError.code !== "email_exists") {
      console.error("demo account", createError.code, createError.message);
      return jsonError(500, "Couldn't create the demo account.");
    }
    ({ error } = await signIn());
  }
  if (error) {
    console.error("demo sign-in", error.code, error.message);
    return jsonError(500, "Couldn't open the demo account. Try again.");
  }

  // An empty demo account gets the labeled sample projects. If this fails,
  // Home still offers "Load demo data", so sign-in itself still succeeds.
  const { count } = await supabase.from("projects").select("id", { count: "exact", head: true });
  if (count === 0) {
    try {
      await seedDemoData(supabase);
    } catch (e) {
      console.error("demo seed", e);
    }
  }
  return Response.json({ ok: true });
}
