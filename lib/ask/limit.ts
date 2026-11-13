import "server-only";

// Best-effort, per server instance: keeps one busy account (like the shared
// demo account) from burning through the OpenAI credits. Not a security boundary.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 40;
const hits = new Map<string, number[]>();

/** True when this user has asked too much recently; otherwise records the hit. */
export function overAskLimit(userId: string): boolean {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(userId, recent);
    return true;
  }
  recent.push(now);
  hits.set(userId, recent);
  return false;
}
