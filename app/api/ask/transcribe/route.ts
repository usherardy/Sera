import { overAskLimit } from "@/lib/ask/limit";
import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";
import { AIError } from "@/lib/projects/openai";
import { transcribeQuestion } from "@/lib/projects/transcribe";

export const maxDuration = 60;

/** About a minute of speech at the recorder's bitrate, well under request limits. */
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Turn a short spoken question into text for the Ask bar. The audio is sent
 * straight to transcription and never stored.
 */
export async function POST(request: Request) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();

  const form = await request.formData().catch(() => null);
  const file = form?.get("audio");
  if (!(file instanceof File) || file.size === 0) return jsonError(400, "No audio was received. Try again.");
  if (file.size > MAX_BYTES) return jsonError(413, "Keep your question under a minute.");
  if (overAskLimit(auth.userId)) return jsonError(429, "That's a lot of questions. Wait a few minutes and try again.");

  // Client and project names help the model spell them right.
  const { data: projects } = await auth.supabase.from("projects").select("name,client_name").limit(40);
  const vocabulary = [...new Set((projects ?? []).flatMap((p) => [p.client_name as string, p.name as string]))];

  try {
    const text = await transcribeQuestion(await file.arrayBuffer(), file.name || "question.webm", file.type || "audio/webm", vocabulary);
    return Response.json({ text });
  } catch (e) {
    return jsonError(502, e instanceof AIError ? e.message : "Couldn't hear that. Try again or type your question.");
  }
}
