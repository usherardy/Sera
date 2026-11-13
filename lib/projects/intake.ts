import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isValidTimeZone } from "@/lib/dates";
import { DEFAULT_TZ, localDateOf } from "@/lib/format";
import { draftFromConversation, type DraftResult } from "./draft";
import { redactInventedAmounts } from "./grounding";
import { runAnalysis } from "./run-analysis";

export interface IntakeSegment {
  speaker: string | null;
  text: string;
}

export type IntakeResult =
  | {
      ok: true;
      projectId: string;
      conversationId: string;
      createdProject: boolean;
      duplicate: boolean;
      analysis: { ok: true; findings: number } | { ok: false; error: string };
    }
  | { ok: false; status: number; error: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const clip = (s: string, n: number) => s.trim().slice(0, n);

/** Merge consecutive segments by the same speaker into "Label: text" lines. */
function joinSegments(segments: IntakeSegment[], label: (speaker: string | null) => string | null) {
  const lines: { who: string | null; text: string }[] = [];
  for (const seg of segments) {
    const who = label(seg.speaker);
    const last = lines[lines.length - 1];
    if (last && last.who === who) last.text += ` ${seg.text}`;
    else lines.push({ who, text: seg.text.trim() });
  }
  return lines.map((l) => (l.who ? `${l.who}: ${l.text}` : l.text)).join("\n");
}

/** Turn the AI draft into a project row. Only what was said; never an invented price or date. */
function projectFromDraft(d: DraftResult["draft"], transcript: string) {
  const priceSaid = d.fixed_price != null && redactInventedAmounts(`${d.fixed_price}€`, transcript) !== "[amount not stated]";
  const currency = d.currency && /^[A-Za-z]{3}$/.test(d.currency) ? d.currency.toUpperCase() : "EUR";
  return {
    name: clip(d.name, 160) || "New client project",
    client_name: (d.client_name && clip(d.client_name, 160)) || "Client not named",
    original_description: clip(d.description, 1000),
    agreed_scope: d.deliverables.map((s) => clip(s, 300)).filter(Boolean).slice(0, 30),
    exclusions: d.exclusions.map((s) => clip(s, 300)).filter(Boolean).slice(0, 30),
    fixed_price: priceSaid ? d.fixed_price : null,
    currency: priceSaid ? currency : "EUR",
    deadline: d.deadline && ISO_DATE.test(d.deadline) ? d.deadline : null,
  };
}

/**
 * One step from a recording (or pasted text) to an analyzed conversation:
 * label speakers, file it under the matching project or create one from what
 * was said, then compare it with that project's agreement.
 */
export async function runIntake(
  supabase: SupabaseClient,
  userId: string,
  input: { segments?: IntakeSegment[]; transcript?: string; source: "paste" | "upload" | "recording"; recordedAt: string },
): Promise<IntakeResult> {
  const hasSpeakers = !!input.segments?.some((s) => s.speaker);
  // What the model reads: speakers as "Speaker A:" until roles are known.
  const rawText = input.segments
    ? joinSegments(input.segments, (s) => (s ? `Speaker ${s}` : null))
    : (input.transcript ?? "").trim();
  if (!rawText.trim()) return { ok: false, status: 400, error: "The transcript is empty." };
  if (rawText.length > 60_000) return { ok: false, status: 400, error: "That conversation is too long (60,000 characters max)." };

  const [{ data: projects }, { data: profile }] = await Promise.all([
    supabase.from("projects").select("id,name,client_name,agreed_scope").order("created_at", { ascending: false }).limit(50),
    supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle(),
  ]);
  const tz = profile?.timezone && isValidTimeZone(profile.timezone) ? profile.timezone : DEFAULT_TZ;

  const draft = await draftFromConversation({
    transcript: rawText,
    projects: projects ?? [],
    conversationDate: localDateOf(input.recordedAt, tz),
    timezone: tz,
  });

  // Label speakers by role so the analysis can tell a request from an acceptance.
  let transcript = rawText;
  if (hasSpeakers && input.segments) {
    const roles = new Map(draft.speaker_roles.map((r) => [r.speaker.replace(/^speaker\s+/i, "").trim(), r.role]));
    transcript = joinSegments(input.segments, (s) => {
      if (!s) return null;
      const role = roles.get(s);
      return role === "client" ? "Client" : role === "freelancer" ? "You" : `Speaker ${s}`;
    });
  }

  // File it: the matched project if the model is sure, else a new one from what was said.
  const known = new Set((projects ?? []).map((p) => p.id));
  let projectId = draft.matched_project_id && known.has(draft.matched_project_id) ? draft.matched_project_id : null;
  const createdProject = !projectId;
  if (!projectId) {
    const { data, error } = await supabase.from("projects").insert(projectFromDraft(draft.draft, transcript)).select("id").single();
    if (error || !data) return { ok: false, status: 500, error: "Couldn't create the project." };
    projectId = data.id as string;
  }

  const { data: dup } = await supabase
    .from("conversations")
    .select("id")
    .eq("project_id", projectId)
    .eq("transcript", transcript)
    .limit(1)
    .maybeSingle();
  if (dup) return { ok: true, projectId, conversationId: dup.id, createdProject, duplicate: true, analysis: { ok: true, findings: 0 } };

  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .insert({
      project_id: projectId,
      title: clip(draft.conversation_title, 160) || "Client conversation",
      transcript,
      source: input.source,
      recorded_at: input.recordedAt,
      // The call that set up a new project is its baseline: later calls are compared against it.
      is_baseline: createdProject,
    })
    .select("id")
    .single();
  if (convError || !conv) return { ok: false, status: 500, error: "Couldn't save the conversation." };

  const result = await runAnalysis(supabase, userId, conv.id);
  return {
    ok: true,
    projectId,
    conversationId: conv.id,
    createdProject,
    duplicate: false,
    analysis: result.ok ? { ok: true, findings: result.findings } : { ok: false, error: result.error },
  };
}
