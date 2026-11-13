import { z } from "zod";
import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";
import { AUDIO_BUCKET } from "@/lib/supabase/config";
import { AIError } from "@/lib/projects/openai";
import { transcribeAudio } from "@/lib/projects/transcribe";

export const maxDuration = 120;

const Body = z.object({
  path: z.string().min(1).max(300),
  mime_type: z.string().max(100),
});

/**
 * Transcribe a recording the browser uploaded to the private bucket, then
 * delete it: SERA keeps the transcript, not the audio.
 */
export async function POST(request: Request) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid request.");
  const { path, mime_type } = parsed.data;
  // Storage policies already restrict this, but only ever touch the user's own folder.
  if (!path.startsWith(`${auth.userId}/`) || path.includes("..")) return jsonError(403, "Not allowed.");

  const storage = auth.supabase.storage.from(AUDIO_BUCKET);
  try {
    const { data: blob, error } = await storage.download(path);
    if (error || !blob) return jsonError(404, "Couldn't find the uploaded audio. Try again.");
    const result = await transcribeAudio(await blob.arrayBuffer(), path.split("/").pop() ?? "audio.webm", mime_type || blob.type || "audio/webm");
    return Response.json(result);
  } catch (e) {
    return jsonError(502, e instanceof AIError ? e.message : "The transcription failed. Try again.");
  } finally {
    await storage.remove([path]).catch(() => {});
  }
}
