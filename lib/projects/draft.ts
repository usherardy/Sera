import "server-only";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { ANALYSIS_MODEL, dateGrid } from "./analyze";
import { AIError, openai, toAIError } from "./openai";

const DraftOut = z.object({
  speaker_roles: z.array(z.object({ speaker: z.string(), role: z.enum(["client", "freelancer", "other"]) })),
  matched_project_id: z.string().nullable(),
  match_reason: z.string(),
  conversation_title: z.string(),
  draft: z.object({
    name: z.string(),
    client_name: z.string().nullable(),
    description: z.string(),
    deliverables: z.array(z.string()),
    exclusions: z.array(z.string()),
    fixed_price: z.number().nullable(),
    currency: z.string().nullable(),
    deadline: z.string().nullable(),
  }),
});
export type DraftResult = z.infer<typeof DraftOut>;

const SYSTEM = `Our user (a studio, agency or independent professional: the "provider") just recorded a conversation with a client. Work out who is who, decide which of the provider's existing projects it belongs to, and draft a project agreement from it in case it's a new project. The provider can correct everything afterwards. Never use the word "freelancer" in any text you write.

SPEAKERS
- If transcript lines start with "Speaker A:", "Speaker B:", … assign each speaker a role in speaker_roles: "freelancer" (the provider: the person delivering the work, usually the one who recorded), "client" (the person paying / asking for work), or "other". Use the content: who asks for deliverables, who promises to build or estimate. If lines have no speaker labels, return an empty list.

MATCHING
- matched_project_id: the id of an existing project ONLY if the conversation is clearly about it (same client or clearly the same work). Otherwise null. Never guess.
- match_reason: one short sentence.

DRAFT (always fill it, even when matched)
- Only include what was actually said. NEVER invent deliverables, a price, a currency, or a deadline.
- name: a short project name, e.g. "Acme Studio Website". client_name: the client's or company's name if said, else null.
- deliverables: concrete things the provider agreed or was asked to deliver, one short phrase each.
- exclusions: things explicitly said to be NOT included.
- fixed_price: only if an amount was stated for the project; currency as a 3-letter code (EUR, USD, GBP) only if stated or obvious from the symbol.
- deadline: YYYY-MM-DD only if a delivery date was stated; resolve relative dates against the conversation date given.
- description: one neutral sentence.

conversation_title: 2-5 words describing this call, e.g. "Kickoff call", "Design review".`;

export async function draftFromConversation(args: {
  transcript: string;
  projects: { id: string; name: string; client_name: string; agreed_scope: string[] }[];
  conversationDate: string;
  timezone: string;
}): Promise<DraftResult> {
  const list = args.projects.length
    ? args.projects.map((p) => `- id=${p.id} | ${p.name} | client: ${p.client_name} | scope: ${p.agreed_scope.join(", ")}`).join("\n")
    : "(no existing projects)";
  try {
    const completion = await openai().chat.completions.parse({
      model: ANALYSIS_MODEL(),
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `EXISTING PROJECTS\n${list}\n\nCONVERSATION DATE: ${args.conversationDate} (${args.timezone}). Next 14 days: ${dateGrid(args.conversationDate)}\n\nTRANSCRIPT\n${args.transcript}`,
        },
      ],
      response_format: zodResponseFormat(DraftOut, "project_draft"),
    });
    const parsed = completion.choices[0]?.message?.parsed;
    if (!parsed) throw new AIError("The model returned an unreadable result. Try again.");
    return DraftOut.parse(parsed);
  } catch (e) {
    throw toAIError(e, "project draft");
  }
}
