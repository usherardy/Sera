import "server-only";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { addDays } from "@/lib/dates";
import { AIError, openai, toAIError } from "./openai";
import type { Project } from "./types";

// Structured output: every field required (nullable where optional) so the
// model must answer each one. Validated again with Zod on our side.
const FindingOut = z.object({
  category: z.enum([
    "potential_scope_addition",
    "scope_modification",
    "existing_scope",
    "clarification_needed",
    "commitment",
    "idea",
  ]),
  title: z.string(),
  description: z.string(),
  source_quote: z.string(),
  related_scope_item: z.string().nullable(),
  explanation: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  suggested_follow_up: z.string().nullable(),
  owner_label: z.string().nullable(),
  due_phrase: z.string().nullable(),
  due_date: z.string().nullable(),
});

export const AnalysisOut = z.object({
  summary: z.string(),
  findings: z.array(FindingOut),
});

export type AnalysisResult = z.infer<typeof AnalysisOut>;
export type RawFinding = z.infer<typeof FindingOut>;

/** Kept as an alias so callers can catch analysis errors by name. */
export const AnalysisError = AIError;

const SYSTEM_PROMPT = `You help a studio, agency or independent professional (the "provider", our user) protect a fixed-price client project from scope creep. You read ONE conversation with a client and compare what was said against the ORIGINAL agreement. A human reviews everything you report; you never decide anything.

Report findings. Each finding is backed by an exact quote from the conversation.

CATEGORIES
- potential_scope_addition: the client asks for or mentions a deliverable that does not appear to be in the original agreed deliverables (or is listed under "Not included"). Say in "description" whether you (the provider) accepted it, declined it, or only said they would look into it.
- scope_modification: an existing requirement or the deadline appears to have changed (for example "remove the contact page", "make it Monday").
- existing_scope: the client asks for something that IS already covered by the original agreement. This is not extra work.
- clarification_needed: you cannot tell whether something is new, the original agreement is ambiguous or silent, or a participant states an approval (for example "I approve the additional cost").
- commitment: someone makes an identifiable promise ("I'll send the revised proposal tomorrow").
- idea: a vague suggestion or future wish ("maybe we can add a blog later"). It is NOT an agreed change.

CRITICAL RULES
1. A client REQUESTING something does not mean the provider ACCEPTED it. Only describe acceptance if someone clearly says yes.
2. A possible scope addition is NOT automatically billable extra work. Never state or imply a price.
3. NEVER invent a price, amount, owner, deadline, approval, or contractual obligation. Only report amounts, dates and owners that are explicitly stated.
4. Never say anything is legally verified or legally binding.
5. If the original agreement is ambiguous or does not say, use clarification_needed and explain what is unclear.
6. A statement of approval (for example "I approve the additional 200 euros") must NOT be treated as confirmed client approval. Report it as clarification_needed and say in "explanation" that the speaker must be verified and the approval recorded manually. Name the speaker only if the transcript labels it.
7. A suggestion or idea ("maybe we could...") is category idea, never a commitment or scope addition, and gets no deadline.
8. If someone corrects an earlier statement (for example "actually, make it Monday"), report ONE scope_modification for the final state and mention the correction in "description". Do not create duplicates.
9. Set owner_label only when the speaker who made the promise is identified in the transcript labels (for example "You" or "Client"). Otherwise null.
10. Resolve relative dates ("tomorrow", "by Friday") against the conversation date given below. Put the resolved date in due_date as YYYY-MM-DD, and the exact words in due_phrase. If no deadline was stated, both are null.
11. source_quote MUST be copied exactly, character for character, from the transcript: one contiguous passage of at most two sentences, WITHOUT the speaker label. Prefer the client's request itself. If you cannot quote evidence, do not report the finding.
12. related_scope_item: the exact original deliverable or exclusion this relates to, copied from the agreement, or null.
13. One finding per distinct request or commitment. Do not report small talk. If there is nothing relevant, return an empty findings list.
14. Be concise. "title" is a short noun phrase. "explanation" says why you classified it that way, referring to the agreement.
15. confidence: "high" only when the quote clearly supports the classification; "low" when ambiguous.
16. In the transcript, lines labeled "You:" are the provider (our user) and "Client:" is the client. Write titles, descriptions and explanations addressing the provider as "you" (e.g. "You said the extra work needs an estimate first"). Never use the word "freelancer".

"summary": two or three neutral sentences on what the conversation was about. Do not infer feelings or intent.`;

export function dateGrid(fromDate: string): string {
  const fmt = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
  return Array.from({ length: 14 }, (_, i) => {
    const d = addDays(fromDate, i);
    const [y, m, day] = d.split("-").map(Number);
    return `${fmt.format(new Date(Date.UTC(y, m - 1, day)))} ${d}`;
  }).join(", ");
}

export function buildUserPrompt(args: {
  project: Pick<Project, "name" | "client_name" | "original_description" | "agreed_scope" | "exclusions" | "fixed_price" | "currency" | "deadline">;
  transcript: string;
  conversationDate: string; // local YYYY-MM-DD
  timezone: string;
}): string {
  const { project: p } = args;
  const list = (items: string[]) => (items.length ? items.map((s) => `- ${s}`).join("\n") : "(none listed)");
  return `ORIGINAL AGREEMENT
Project: ${p.name}
Client: ${p.client_name}
${p.original_description ? `Description: ${p.original_description}\n` : ""}Agreed deliverables:
${list(p.agreed_scope)}
Explicitly not included / constraints:
${list(p.exclusions)}
Fixed price: ${p.fixed_price != null ? `${p.fixed_price} ${p.currency}` : "not stated"}
Original deadline: ${p.deadline ?? "not stated"}

CONVERSATION DATE: ${args.conversationDate} (${args.timezone}). Next 14 days: ${dateGrid(args.conversationDate)}

TRANSCRIPT
${args.transcript}`;
}

export const ANALYSIS_MODEL = () => process.env.OPENAI_ANALYSIS_MODEL || "gpt-4o";

/** One structured-output call. Throws AnalysisError with a user-safe message. */
export async function analyzeConversation(args: Parameters<typeof buildUserPrompt>[0]): Promise<AnalysisResult> {
  try {
    const completion = await openai().chat.completions.parse({
      model: ANALYSIS_MODEL(),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(args) },
      ],
      response_format: zodResponseFormat(AnalysisOut, "scope_analysis"),
    });
    const message = completion.choices[0]?.message;
    if (message?.refusal) throw new AIError("The model declined to analyze this conversation.");
    const parsed = message?.parsed;
    if (!parsed) throw new AIError("The model returned an unreadable result. Try again.");
    return AnalysisOut.parse(parsed);
  } catch (e) {
    throw toAIError(e, "analysis");
  }
}
