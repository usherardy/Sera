import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { groundQuote } from "@/lib/projects/grounding";
import { buildClientMessage } from "@/lib/projects/message";
import { SAMPLE_PROJECTS } from "@/lib/sample/demo";

/** A seeding step failed; the message is safe to show. */
export class SeedError extends Error {}

/**
 * Load the clearly labeled demo data for the signed-in user: two sample
 * projects with conversations, summaries, PRE-WRITTEN example findings in
 * every state, and tasks. Every row is is_sample = true and shows a Sample
 * badge. Loading again replaces the previous demo data (real projects are
 * never touched). Returns the first sample project's id.
 */
export async function seedDemoData(supabase: SupabaseClient): Promise<string | null> {
  const removed = await supabase.from("projects").delete().eq("is_sample", true);
  if (removed.error) throw new SeedError("Couldn't replace the previous demo data.");

  let firstId: string | null = null;
  for (const sample of SAMPLE_PROJECTS) {
    const { data: project, error } = await supabase
      .from("projects")
      .insert({ ...sample.project, is_sample: true })
      .select("id")
      .single();
    if (error || !project) throw new SeedError("Couldn't add the demo projects.");
    firstId ??= project.id as string;

    const { data: convs, error: convError } = await supabase
      .from("conversations")
      .insert(
        sample.conversations.map((c) => ({
          project_id: project.id,
          title: c.title,
          transcript: c.transcript,
          summary: c.summary,
          source: "paste",
          recorded_at: c.recorded_at,
          processing_status: "completed",
          is_sample: true,
        })),
      )
      .select("id,title");
    if (convError || !convs) throw new SeedError("Couldn't add the demo conversations.");

    const convByKey = new Map(sample.conversations.map((c) => [c.key, { ...c, id: convs.find((x) => x.title === c.title)?.id }]));
    const rows = [];
    for (const f of sample.findings) {
      const c = convByKey.get(f.conv);
      // Same rule as live analysis: the quote must exist in the transcript.
      const quote = c?.id ? groundQuote(f.quote, c.transcript) : null;
      if (!c?.id || !quote) throw new SeedError(`Demo finding "${f.title}" has a quote that isn't in its transcript.`);
      const callDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Vilnius" }).format(new Date(c.recorded_at));
      rows.push({
        project_id: project.id,
        conversation_id: c.id,
        category: f.category,
        title: f.title,
        description: f.description,
        source_quote: quote,
        related_scope_item: f.related_scope_item,
        explanation: f.explanation,
        confidence: f.confidence,
        suggested_follow_up: f.suggested_follow_up,
        owner_label: f.owner_label,
        due_date: f.due_date,
        due_phrase: f.due_phrase,
        review_status: f.review_status ?? "ai_detected",
        client_status: f.client_status ?? "not_sent",
        notes: f.notes ?? null,
        client_message: f.message ? buildClientMessage(sample.project, { ...f, source_quote: quote }, callDate) : null,
        is_sample: true,
      });
    }
    const { data: findings, error: fError } = await supabase.from("findings").insert(rows).select("id,title");
    if (fError || !findings) throw new SeedError("Couldn't add the demo findings.");

    if (sample.tasks.length > 0) {
      const { error: tError } = await supabase.from("tasks").insert(
        sample.tasks.map((t) => ({
          project_id: project.id,
          finding_id: t.finding ? (findings.find((x) => x.title === t.finding)?.id ?? null) : null,
          title: t.title,
          owner: t.owner,
          due_date: t.due_date,
          status: t.status,
          auto_created: t.auto ?? false,
          is_sample: true,
        })),
      );
      if (tError) throw new SeedError("Couldn't add the demo tasks.");
    }
  }
  return firstId;
}
