import { z } from "zod";
import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";
import { isValidTimeZone } from "@/lib/dates";
import { DEFAULT_TZ, localDateOf } from "@/lib/format";
import { draftFromConversation } from "@/lib/projects/draft";
import { redactInventedAmounts } from "@/lib/projects/grounding";
import { AIError } from "@/lib/projects/openai";

export const maxDuration = 60;

const Body = z.object({
  transcript: z.string().trim().min(1, "The transcript is empty.").max(60_000),
  recorded_at: z.iso.datetime({ offset: true }).optional(),
});

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const clip = (s: string, n: number) => s.trim().slice(0, n);

/**
 * Suggest which project a new conversation belongs to, and draft an agreement
 * for a new project from what was said. Nothing is saved here; the freelancer
 * confirms first.
 */
export async function POST(request: Request) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid request.");
  const { transcript } = parsed.data;

  const [{ data: projects }, { data: profile }] = await Promise.all([
    auth.supabase.from("projects").select("id,name,client_name,agreed_scope").order("created_at", { ascending: false }).limit(50),
    auth.supabase.from("profiles").select("timezone").eq("id", auth.userId).maybeSingle(),
  ]);
  const tz = profile?.timezone && isValidTimeZone(profile.timezone) ? profile.timezone : DEFAULT_TZ;
  const when = parsed.data.recorded_at ?? new Date().toISOString();

  try {
    const res = await draftFromConversation({
      transcript,
      projects: projects ?? [],
      conversationDate: localDateOf(when, tz),
      timezone: tz,
    });
    const d = res.draft;
    const known = new Set((projects ?? []).map((p) => p.id));

    // Enforce "never invent": a price must have been said; dates must be real dates.
    const priceSaid = d.fixed_price != null && redactInventedAmounts(`${d.fixed_price}€`, transcript) !== "[amount not stated]";
    const currency = d.currency && /^[A-Za-z]{3}$/.test(d.currency) ? d.currency.toUpperCase() : null;

    return Response.json({
      matched_project_id: res.matched_project_id && known.has(res.matched_project_id) ? res.matched_project_id : null,
      match_reason: clip(res.match_reason, 300),
      conversation_title: clip(res.conversation_title, 80) || "Client conversation",
      draft: {
        name: clip(d.name, 160) || "New project",
        client_name: d.client_name ? clip(d.client_name, 160) : "",
        original_description: clip(d.description, 1000),
        agreed_scope: d.deliverables.map((s) => clip(s, 300)).filter(Boolean).slice(0, 30),
        exclusions: d.exclusions.map((s) => clip(s, 300)).filter(Boolean).slice(0, 30),
        fixed_price: priceSaid ? d.fixed_price : null,
        currency: priceSaid && currency ? currency : "EUR",
        deadline: d.deadline && ISO_DATE.test(d.deadline) ? d.deadline : null,
      },
    });
  } catch (e) {
    return jsonError(502, e instanceof AIError ? e.message : "Couldn't draft the project. Try again.");
  }
}
