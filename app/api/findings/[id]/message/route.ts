import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";
import { isValidTimeZone } from "@/lib/dates";
import { DEFAULT_TZ } from "@/lib/format";
import { buildClientMessage } from "@/lib/projects/message";

/** Generate (and save) a client confirmation message that asks for approval. */
export async function POST(_request: Request, ctx: RouteContext<"/api/findings/[id]/message">) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  const { id } = await ctx.params;

  const { data: f } = await auth.supabase
    .from("findings")
    .select("project_id,conversation_id,category,title,source_quote,related_scope_item,due_date,due_phrase")
    .eq("id", id)
    .maybeSingle();
  if (!f) return jsonError(404, "Not found.");

  const [{ data: project }, { data: conv }, { data: profile }] = await Promise.all([
    auth.supabase.from("projects").select("name,client_name,agreed_scope,deadline").eq("id", f.project_id).maybeSingle(),
    auth.supabase.from("conversations").select("recorded_at").eq("id", f.conversation_id).maybeSingle(),
    auth.supabase.from("profiles").select("timezone").eq("id", auth.userId).maybeSingle(),
  ]);
  if (!project || !conv) return jsonError(404, "Not found.");

  const tz = profile?.timezone && isValidTimeZone(profile.timezone) ? profile.timezone : DEFAULT_TZ;
  const callDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: tz }).format(new Date(conv.recorded_at));

  const message = buildClientMessage(project, f, callDate);
  if (!message) return jsonError(400, "This kind of finding doesn't need a client approval request.");

  const { error } = await auth.supabase.from("findings").update({ client_message: message, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return jsonError(500, "Couldn't save the message.");
  return Response.json({ message });
}
