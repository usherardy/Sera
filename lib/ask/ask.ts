import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { formatDateOnly, localDateOf } from "@/lib/format";
import { ANALYSIS_MODEL, dateGrid } from "@/lib/projects/analyze";
import { redactInventedAmounts } from "@/lib/projects/grounding";
import { AIError, openai, toAIError } from "@/lib/projects/openai";
import type { ClientStatus, FindingCategory, ReviewStatus } from "@/lib/projects/types";
import type { AskResponse, AskSource } from "./types";

/*
 * "Ask Sera": answer a question about your clients from what Sera already
 * stored (agreements, calls, findings, tasks). Read-only: it never sends,
 * edits or creates anything. Email requests come back as a DRAFT for you to
 * review and send yourself. Sources are resolved here from stored rows, so the
 * quotes and links you see are never written by the AI.
 */

type ProjectRow = {
  id: string;
  name: string;
  client_name: string;
  original_description: string;
  agreed_scope: string[];
  exclusions: string[];
  fixed_price: number | null;
  currency: string;
  deadline: string | null;
};
type ConversationRow = {
  id: string;
  project_id: string;
  title: string;
  summary: string | null;
  recorded_at: string;
  is_baseline: boolean;
  processing_status: string;
  transcript?: string;
};
type FindingRow = {
  id: string;
  project_id: string;
  conversation_id: string;
  category: FindingCategory;
  title: string;
  description: string;
  source_quote: string;
  related_scope_item: string | null;
  explanation: string;
  suggested_follow_up: string | null;
  owner_label: string | null;
  due_date: string | null;
  due_phrase: string | null;
  review_status: ReviewStatus;
  client_status: ClientStatus;
};
type TaskRow = { id: string; project_id: string; finding_id: string | null; title: string; owner: string | null; due_date: string | null; status: string };

export interface AskData {
  projects: ProjectRow[];
  conversations: ConversationRow[];
  findings: FindingRow[];
  tasks: TaskRow[];
}

/** Transcripts are included only for one project, and only while they fit. */
const TRANSCRIPT_BUDGET = 40_000;

/** Everything the question may be about, read as the signed-in user (RLS applies). */
export async function loadAskData(supabase: SupabaseClient, projectId: string | null): Promise<AskData> {
  let projectsQ = supabase.from("projects").select("id,name,client_name,original_description,agreed_scope,exclusions,fixed_price,currency,deadline");
  let conversationsQ = supabase
    .from("conversations")
    .select(`id,project_id,title,summary,recorded_at,is_baseline,processing_status${projectId ? ",transcript" : ""}`);
  let findingsQ = supabase
    .from("findings")
    .select(
      "id,project_id,conversation_id,category,title,description,source_quote,related_scope_item,explanation,suggested_follow_up,owner_label,due_date,due_phrase,review_status,client_status",
    )
    .neq("review_status", "dismissed");
  let tasksQ = supabase.from("tasks").select("id,project_id,finding_id,title,owner,due_date,status");
  if (projectId) {
    projectsQ = projectsQ.eq("id", projectId);
    conversationsQ = conversationsQ.eq("project_id", projectId);
    findingsQ = findingsQ.eq("project_id", projectId);
    tasksQ = tasksQ.eq("project_id", projectId);
  }
  const [projects, conversations, findings, tasks] = await Promise.all([
    projectsQ.order("created_at", { ascending: true }).limit(50),
    conversationsQ.order("recorded_at", { ascending: true }).limit(200),
    findingsQ.order("created_at", { ascending: true }).limit(400),
    tasksQ.order("created_at", { ascending: true }).limit(400),
  ]);
  const err = projects.error ?? conversations.error ?? findings.error ?? tasks.error;
  if (err) throw new AIError("Couldn't read your projects. Try again.");

  const convs = (conversations.data ?? []) as unknown as ConversationRow[];
  // Keep the newest transcripts that fit the budget (newest calls matter most).
  let budget = TRANSCRIPT_BUDGET;
  for (const c of [...convs].reverse()) {
    if (!c.transcript) continue;
    if (c.transcript.length <= budget) budget -= c.transcript.length;
    else delete c.transcript;
  }
  return {
    projects: (projects.data ?? []) as unknown as ProjectRow[],
    conversations: convs,
    findings: (findings.data ?? []) as unknown as FindingRow[],
    tasks: (tasks.data ?? []) as unknown as TaskRow[],
  };
}

/* ------------------------------------------------------------ prompt */

const CATEGORY_WORDS: Record<FindingCategory, string> = {
  potential_scope_addition: "Possible addition (not in the agreement)",
  scope_modification: "Scope change (differs from the agreement)",
  existing_scope: "Already in scope",
  clarification_needed: "Needs clarification",
  commitment: "Promise",
  idea: "Idea (not a commitment)",
};
const REVIEW_WORDS: Record<ReviewStatus, string> = {
  ai_detected: "needs your review",
  reviewed: "reviewed by you",
  dismissed: "dismissed by you",
};
const CLIENT_WORDS: Record<ClientStatus, string> = {
  not_sent: "not raised with the client yet",
  sent: "raised with the client, no answer yet",
  approved: "APPROVED by the client",
  rejected: "rejected by the client",
};

const SYSTEM_PROMPT = `You are Sera's assistant. Sera records client calls for agencies and studios, keeps each client's project separate, lists what needs doing, and flags anything a client asks for beyond what was agreed. The person asking runs the agency or studio: address them as "you". Never use the word "freelancer".

Rules:
1. Answer ONLY from the DATA block. Never guess. If the answer isn't there, set found=false and say plainly that you don't see it in their calls (suggest recording or adding the call).
2. Be brief and concrete: "answer" is 1-3 short sentences; "points" are at most 8 one-line items (titles, dates, statuses). Plain text, no markdown, no emojis.
3. Cite: list in "sources" the refs (P1, C2, F3, T4 …) your answer is based on, most relevant first, at most 8. Use only refs that appear in DATA. Prefer findings (F) and tasks (T) over whole calls or projects.
4. Do not put quotation marks or quotes from calls in "answer" or "points": the app shows the exact quotes from your sources.
5. Dates: write them like "Fri, Nov 20". Use TODAY to resolve "this week", "upcoming", "overdue". Never invent a date, time, price or amount.
6. The original agreement is what was agreed at the start. Changes the client APPROVED are part of the current scope; everything else is not, even if the client asked for it. A client request is never an approval. Report review and client statuses exactly as given. "Open" or "pending" changes are ones the client has NOT approved or rejected yet; leave approved and rejected ones out of drafts unless asked.
7. "The meeting" or "the last call" with no other detail means the most recent call in scope (marked "latest call").
8. You cannot take actions: you never send emails, edit projects, approve changes or create tasks. Never say you did.
9. When asked to email, message or write to a client: fill "draft" (otherwise draft = null). Address the client by name, restate only facts from DATA, ask them to confirm, and say nothing changes until they confirm. If a price or timeline for extra work isn't in DATA, say you'll send an estimate separately. You may quote the client's exact words from a finding's Quote, inside quotation marks (“…”). Keep it short: greeting, what was said, what it means against the agreement, the ask. End with "Thanks," and no name. In "answer", say it's a draft for them to review and send.
10. When asked to revise or update the project or agreement: don't claim it's done. List what would change (with refs) and say to use "Edit agreement" on the project page once the client has confirmed in writing.`;

function list(items: string[]) {
  return items.length ? items.join("; ") : "none listed";
}

/** The DATA block, with short refs (P1, C1, F1, T1) the model cites by. */
export function buildAskPrompt(data: AskData, opts: { question: string; today: string; timezone: string; scopedProject: boolean }) {
  const refs = new Map<string, { kind: "project" | "conversation" | "finding" | "task"; id: string }>();
  const ref = (prefix: string, kind: "project" | "conversation" | "finding" | "task", id: string) => {
    const key = `${prefix}${[...refs.values()].filter((r) => r.kind === kind).length + 1}`;
    refs.set(key, { kind, id });
    return key;
  };
  const convRef = new Map<string, string>();
  const findingRef = new Map<string, string>();
  const blocks: string[] = [];

  for (const p of data.projects) {
    const pKey = ref("P", "project", p.id);
    const calls = data.conversations.filter((c) => c.project_id === p.id);
    const latest = calls.at(-1)?.id;
    const lines: string[] = [
      `PROJECT ${pKey}: ${p.name} (client: ${p.client_name})`,
      p.original_description ? `  Description: ${p.original_description}` : "",
      `  Original agreement. Agreed deliverables: ${list(p.agreed_scope)}. Not included: ${list(p.exclusions)}.`,
      `  Fixed price: ${p.fixed_price != null ? `${p.fixed_price} ${p.currency}` : "not stated"}. Original deadline: ${p.deadline ? `${p.deadline} (${formatDateOnly(p.deadline)})` : "not stated"}.`,
      `  Calls, oldest first:`,
    ];
    for (const c of calls) {
      const cKey = ref("C", "conversation", c.id);
      convRef.set(c.id, cKey);
      const date = localDateOf(c.recorded_at, opts.timezone);
      const tags = [c.is_baseline && "baseline: set up the agreement", c.id === latest && "latest call", c.processing_status !== "completed" && `analysis ${c.processing_status}`]
        .filter(Boolean)
        .join(", ");
      lines.push(`    ${cKey} ${date} (${formatDateOnly(date)}) "${c.title}"${tags ? ` [${tags}]` : ""}. Summary: ${c.summary ?? "none"}`);
      if (c.transcript) lines.push(`      Transcript:\n${c.transcript.replace(/^/gm, "        ")}`);
    }
    const fs = data.findings.filter((f) => f.project_id === p.id);
    if (fs.length) lines.push("  Findings:");
    for (const f of fs) {
      const fKey = ref("F", "finding", f.id);
      findingRef.set(f.id, fKey);
      const due = f.due_date ? ` Due: ${f.due_date} (${formatDateOnly(f.due_date)})${f.due_phrase ? `, said as "${f.due_phrase}"` : ""}.` : "";
      lines.push(
        `    ${fKey} from ${convRef.get(f.conversation_id) ?? "a call"}: ${CATEGORY_WORDS[f.category]}: ${f.title}. ${f.description} ${f.explanation}`.trim() +
          `${f.related_scope_item ? ` Agreement item: ${f.related_scope_item}.` : ""} Status: ${REVIEW_WORDS[f.review_status]}; ${CLIENT_WORDS[f.client_status]}.` +
          `${f.owner_label ? ` Owner: ${f.owner_label}.` : ""}${due}${f.suggested_follow_up ? ` Suggested follow-up: ${f.suggested_follow_up}.` : ""}`,
        `      Quote: "${f.source_quote}"`,
      );
    }
    const ts = data.tasks.filter((t) => t.project_id === p.id);
    if (ts.length) lines.push("  Tasks:");
    for (const t of ts) {
      const tKey = ref("T", "task", t.id);
      lines.push(
        `    ${tKey} [${t.status}] ${t.title}. Owner: ${t.owner ?? "unassigned"}. Due: ${t.due_date ? `${t.due_date} (${formatDateOnly(t.due_date)})` : "no date"}.${t.finding_id && findingRef.get(t.finding_id) ? ` From ${findingRef.get(t.finding_id)}.` : ""}`,
      );
    }
    blocks.push(lines.filter(Boolean).join("\n"));
  }

  const user = `TODAY: ${opts.today} (${formatDateOnly(opts.today)}), timezone ${opts.timezone}. Next 14 days: ${dateGrid(opts.today)}
SCOPE: ${opts.scopedProject ? "only this project" : "all of your clients"}

DATA
${blocks.join("\n\n") || "(no projects yet)"}

QUESTION
${opts.question}`;
  return { system: SYSTEM_PROMPT, user, refs };
}

/* ------------------------------------------------------------ model + resolve */

const AskOut = z.object({
  found: z.boolean(),
  answer: z.string(),
  points: z.array(z.string()),
  sources: z.array(z.string()),
  draft: z.object({ project_ref: z.string(), subject: z.string(), body: z.string() }).nullable(),
});

export const ASK_MODEL = () => process.env.OPENAI_ASK_MODEL || ANALYSIS_MODEL();

export async function askSera(
  data: AskData,
  opts: { question: string; today: string; timezone: string; scopedProject: boolean },
): Promise<AskResponse> {
  const { system, user, refs } = buildAskPrompt(data, opts);
  const model = ASK_MODEL();
  let out: z.infer<typeof AskOut>;
  try {
    const completion = await openai().chat.completions.parse({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: zodResponseFormat(AskOut, "sera_answer"),
      // Reasoning models: keep answers fast.
      ...(/^(gpt-5|o\d)/.test(model) ? { reasoning_effort: "low" as const } : {}),
    });
    const message = completion.choices[0]?.message;
    if (message?.refusal) throw new AIError("Sera couldn't answer that one.");
    if (!message?.parsed) throw new AIError("Sera returned an unreadable answer. Try again.");
    out = AskOut.parse(message.parsed);
  } catch (e) {
    throw toAIError(e, "answer");
  }

  // Amounts must come from the data; anything else is redacted.
  const clean = (s: string) => redactInventedAmounts(s.trim(), user);
  const sources = resolveSources(out.sources, refs, data, opts.timezone);

  let draft: AskResponse["draft"] = null;
  if (out.draft) {
    const target = refs.get(out.draft.project_ref);
    const project =
      (target?.kind === "project" && data.projects.find((p) => p.id === target.id)) ||
      (data.projects.length === 1 ? data.projects[0] : null);
    draft = {
      to: project?.client_name ?? "the client",
      subject: clean(out.draft.subject).slice(0, 160),
      body: clean(out.draft.body).slice(0, 5000),
    };
  }

  return {
    found: out.found,
    answer: clean(out.answer).slice(0, 1200),
    points: out.points.map(clean).filter(Boolean).slice(0, 8),
    sources,
    draft,
  };
}

function resolveSources(
  keys: string[],
  refs: Map<string, { kind: "project" | "conversation" | "finding" | "task"; id: string }>,
  data: AskData,
  timezone: string,
): AskSource[] {
  const out: AskSource[] = [];
  const seen = new Set<string>();
  const project = (id: string) => data.projects.find((p) => p.id === id);
  const conv = (id: string) => data.conversations.find((c) => c.id === id);
  const day = (iso: string) => formatDateOnly(localDateOf(iso, timezone));

  for (const raw of keys) {
    const key = raw.trim().toUpperCase();
    const r = refs.get(key);
    if (!r || seen.has(key)) continue; // unknown refs are dropped, never shown
    seen.add(key);
    if (r.kind === "finding") {
      const f = data.findings.find((x) => x.id === r.id);
      const c = f && conv(f.conversation_id);
      const p = f && project(f.project_id);
      if (!f || !c || !p) continue;
      out.push({
        key,
        kind: "finding",
        category: f.category,
        title: f.title,
        quote: f.source_quote,
        meta: `${p.name} · ${c.title} · ${day(c.recorded_at)}`,
        href: `/projects/${p.id}/conversations/${c.id}?finding=${f.id}`,
      });
    } else if (r.kind === "task") {
      const t = data.tasks.find((x) => x.id === r.id);
      const p = t && project(t.project_id);
      if (!t || !p) continue;
      out.push({
        key,
        kind: "task",
        title: t.title,
        meta: `${p.name} · ${t.due_date ? `due ${formatDateOnly(t.due_date)}` : "no date"}`,
        href: "/todo",
        done: t.status === "done",
      });
    } else if (r.kind === "conversation") {
      const c = conv(r.id);
      const p = c && project(c.project_id);
      if (!c || !p) continue;
      out.push({ key, kind: "conversation", title: c.title, meta: `${p.name} · ${day(c.recorded_at)}`, href: `/projects/${p.id}/conversations/${c.id}` });
    } else {
      const p = project(r.id);
      if (!p) continue;
      out.push({ key, kind: "project", title: p.name, meta: p.client_name, href: `/projects/${p.id}` });
    }
    if (out.length >= 8) break;
  }
  return out;
}
