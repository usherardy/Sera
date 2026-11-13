import { z } from "zod";
import { getAuthedClient, jsonError, unauthorized } from "@/lib/auth";
import { runIntake } from "@/lib/projects/intake";
import { AIError } from "@/lib/projects/openai";

// Two AI calls (set up the project, then compare), so allow time.
export const maxDuration = 120;

const Body = z
  .object({
    segments: z.array(z.object({ speaker: z.string().max(20).nullable(), text: z.string().max(20_000) })).max(2000).optional(),
    transcript: z.string().max(60_000).optional(),
    source: z.enum(["paste", "upload", "recording"]),
    recorded_at: z.iso.datetime({ offset: true }),
  })
  .refine((b) => b.segments?.length || b.transcript?.trim(), "The transcript is empty.");

/** Recording or pasted text → labeled transcript → matched or new project → analyzed conversation. */
export async function POST(request: Request) {
  const auth = await getAuthedClient();
  if (!auth) return unauthorized();

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid request.");
  const b = parsed.data;

  try {
    const res = await runIntake(auth.supabase, auth.userId, {
      segments: b.segments,
      transcript: b.transcript,
      source: b.source,
      recordedAt: b.recorded_at,
    });
    if (!res.ok) return jsonError(res.status, res.error);
    return Response.json(res, { status: 201 });
  } catch (e) {
    return jsonError(502, e instanceof AIError ? e.message : "Couldn't set up this conversation. Try again.");
  }
}
