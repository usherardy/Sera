import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isValidTimeZone } from "@/lib/dates";
import { DEFAULT_TZ, localDateOf } from "@/lib/format";
import { AnalysisError, analyzeConversation } from "./analyze";
import { toFindingRows } from "./process";
import type { Project } from "./types";

const STUCK_AFTER_MS = 3 * 60 * 1000;

export type RunResult =
  | { ok: true; findings: number; dropped: number }
  | { ok: false; status: "busy" | "failed" | "not_found"; error: string };

/**
 * Analyze one conversation and store its findings. Safe to call twice:
 * an atomic claim means a second call while one is running does nothing, and
 * re-running replaces only findings the freelancer hasn't reviewed yet.
 */
export async function runAnalysis(supabase: SupabaseClient, userId: string, conversationId: string): Promise<RunResult> {
  const staleBefore = new Date(Date.now() - STUCK_AFTER_MS).toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from("conversations")
    .update({ processing_status: "analyzing", analysis_started_at: new Date().toISOString(), error_message: null })
    .eq("id", conversationId)
    .or(`processing_status.neq.analyzing,analysis_started_at.lt.${staleBefore}`)
    .select("id,project_id,transcript,recorded_at")
    .maybeSingle();
  if (claimError) return { ok: false, status: "failed", error: "Couldn't start the analysis." };
  if (!claimed) {
    const { data: exists } = await supabase.from("conversations").select("id").eq("id", conversationId).maybeSingle();
    return exists
      ? { ok: false, status: "busy", error: "This conversation is already being analyzed." }
      : { ok: false, status: "not_found", error: "Not found." };
  }

  const fail = async (error: string): Promise<RunResult> => {
    await supabase.from("conversations").update({ processing_status: "failed", error_message: error }).eq("id", conversationId);
    return { ok: false, status: "failed", error };
  };

  try {
    const [{ data: project }, { data: profile }] = await Promise.all([
      supabase
        .from("projects")
        .select("name,client_name,original_description,agreed_scope,exclusions,fixed_price,currency,deadline")
        .eq("id", claimed.project_id)
        .maybeSingle(),
      supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle(),
    ]);
    if (!project) return await fail("The project for this conversation no longer exists.");
    const timezone = profile?.timezone && isValidTimeZone(profile.timezone) ? profile.timezone : DEFAULT_TZ;
    const transcript: string = claimed.transcript;

    const analysis = await analyzeConversation({
      project: project as Pick<Project, "name" | "client_name" | "original_description" | "agreed_scope" | "exclusions" | "fixed_price" | "currency" | "deadline">,
      transcript,
      conversationDate: localDateOf(claimed.recorded_at, timezone),
      timezone,
    });

    // Amounts are only allowed if they were actually said or are in the agreement.
    const { rows: found, dropped } = toFindingRows(
      analysis.findings,
      transcript,
      `${transcript}\n${project.fixed_price ?? ""} ${project.currency}`,
    );
    const rows = found.map((r) => ({ ...r, project_id: claimed.project_id, conversation_id: conversationId }));

    // Replace only what the freelancer hasn't touched; keep their reviewed/dismissed decisions.
    const { error: delError } = await supabase
      .from("findings")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("review_status", "ai_detected");
    if (delError) return await fail("Couldn't save the analysis. Try again.");

    const { data: kept } = await supabase.from("findings").select("source_quote,category").eq("conversation_id", conversationId);
    const keptKeys = new Set((kept ?? []).map((k) => `${k.category}|${k.source_quote}`));
    const fresh = rows.filter((r) => !keptKeys.has(`${r.category}|${r.source_quote}`));

    if (fresh.length > 0) {
      const { error: insError } = await supabase.from("findings").insert(fresh);
      if (insError) return await fail("Couldn't save the analysis. Try again.");
    }

    const { error: doneError } = await supabase
      .from("conversations")
      .update({ processing_status: "completed", summary: analysis.summary.trim() || null, error_message: null })
      .eq("id", conversationId);
    if (doneError) return await fail("Couldn't save the analysis. Try again.");

    return { ok: true, findings: fresh.length, dropped };
  } catch (e) {
    return await fail(e instanceof AnalysisError ? e.message : "The analysis failed. Try again.");
  }
}
