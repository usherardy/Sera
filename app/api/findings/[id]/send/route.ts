import { z } from "zod";
import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";
import { SendError, overSendLimit, recipientAllowed, sendWithGmail } from "@/lib/email/gmail";
import { isChangeCategory } from "@/lib/projects/meta";
import type { FindingCategory } from "@/lib/projects/types";

const Body = z.object({
  to: z.email().max(254),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(8000),
});

/**
 * Send the change request to the client through Gmail, then record it as
 * "Sent to client". Only after the user confirmed the finding, and only when
 * they press Send: nothing is sent automatically.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/findings/[id]/send">) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();
  const { id } = await ctx.params;

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.path[0] === "to" ? "Enter the client's email address." : "The email needs a subject and a message.");
  const { to, subject, body } = parsed.data;

  const { data: f } = await auth.supabase.from("findings").select("category,review_status").eq("id", id).maybeSingle();
  if (!f) return jsonError(404, "Not found.");
  if (!isChangeCategory(f.category as FindingCategory)) return jsonError(400, "This kind of finding doesn't need a client approval request.");
  if (f.review_status !== "reviewed") return jsonError(409, "Confirm the finding before sending it to the client.");
  if (!recipientAllowed(to)) return jsonError(403, "On this demo, emails can only go to the team's test addresses.");
  if (overSendLimit(auth.userId)) return jsonError(429, "That's a lot of emails in an hour. Try again later, or use Open in Gmail.");

  const { data: profile } = await auth.supabase.from("profiles").select("display_name").eq("id", auth.userId).maybeSingle();
  try {
    await sendWithGmail({ to, subject, text: body, fromName: profile?.display_name?.trim() || "Sera" });
  } catch (e) {
    return jsonError(e instanceof SendError ? 502 : 500, e instanceof SendError ? e.message : "Couldn't send the email.");
  }

  const { error } = await auth.supabase
    .from("findings")
    .update({ client_message: body, client_status: "sent", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return jsonError(500, "The email was sent, but Sera couldn't record it. Set the client's answer to Sent.");
  return Response.json({ ok: true });
}
