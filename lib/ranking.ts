import type { Confidence, Moment, MomentCategory, WithSource } from "@/lib/types";

// Brief §3 ranking: explicit decisions, then accepted commitments, then important
// changes/information, then personal notes. Never by length or frequency.
const CATEGORY_WEIGHT: Record<MomentCategory, number> = {
  decision: 4,
  commitment: 3,
  important_information: 2,
  personal_note: 1,
};
const CONFIDENCE_WEIGHT: Record<Confidence, number> = { high: 0.6, medium: 0.3, low: 0 };

function score(m: Moment) {
  return CATEGORY_WEIGHT[m.category] + CONFIDENCE_WEIGHT[m.confidence];
}

/**
 * Most significant moments first. With a limit, the best moment of each
 * category is taken (in priority order) before filling with the next best,
 * so a short preview isn't three variations of the same kind of moment.
 */
export function rankMoments<T extends Moment>(moments: T[], limit?: number): T[] {
  const ranked = moments
    .filter((m) => !m.dismissed)
    .map((m, i) => ({ m, i }))
    .sort((a, b) => score(b.m) - score(a.m) || a.i - b.i)
    .map((x) => x.m);
  if (!limit) return ranked;

  const picked: T[] = [];
  const seen = new Set<MomentCategory>();
  for (const m of ranked) {
    if (picked.length >= limit) break;
    if (!seen.has(m.category)) {
      picked.push(m);
      seen.add(m.category);
    }
  }
  for (const m of ranked) {
    if (picked.length >= limit) break;
    if (!picked.includes(m)) picked.push(m);
  }
  return picked;
}

/** Wall-clock order across recordings (recording start + offset). */
export function byMomentTime(a: Moment & WithSource, b: Moment & WithSource) {
  const t = (m: Moment & WithSource) => new Date(m.recording.recorded_at).getTime() + (m.start_ms ?? 0);
  return t(a) - t(b);
}
