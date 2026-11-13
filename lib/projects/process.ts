import { groundQuote, redactInventedAmounts } from "./grounding";
import type { RawFinding } from "./analyze";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface FindingRow {
  category: RawFinding["category"];
  title: string;
  description: string;
  source_quote: string;
  related_scope_item: string | null;
  explanation: string;
  confidence: RawFinding["confidence"];
  suggested_follow_up: string | null;
  owner_label: string | null;
  due_date: string | null;
  due_phrase: string | null;
}

/**
 * Turn raw model findings into storable rows. Enforces the product rules in
 * code, not just in the prompt: quotes must exist in the transcript (else the
 * finding is dropped), invented amounts are redacted, and ideas never get a
 * task, owner or deadline.
 */
/** On a baseline call (the one that set up the agreement) there is nothing to compare against. */
const BASELINE_DROPS: RawFinding["category"][] = ["potential_scope_addition", "scope_modification", "existing_scope"];

export function toFindingRows(
  findings: RawFinding[],
  transcript: string,
  allowedAmountsText: string,
  opts: { baseline?: boolean } = {},
): { rows: FindingRow[]; dropped: number } {
  const clean = (s: string | null) => (s == null ? s : redactInventedAmounts(s, allowedAmountsText));
  const seen = new Set<string>();
  const rows: FindingRow[] = [];
  let dropped = 0;

  for (const f of findings) {
    if (opts.baseline && BASELINE_DROPS.includes(f.category)) {
      dropped++;
      continue;
    }
    const quote = groundQuote(f.source_quote, transcript);
    if (!quote || seen.has(`${f.category}|${quote}`)) {
      dropped++;
      continue;
    }
    seen.add(`${f.category}|${quote}`);
    const isIdea = f.category === "idea";
    const hasDate = !isIdea && !!f.due_date && ISO_DATE.test(f.due_date);
    rows.push({
      category: f.category,
      title: clean(f.title)?.slice(0, 200) || "Untitled finding",
      description: clean(f.description) ?? "",
      source_quote: quote,
      related_scope_item: f.related_scope_item,
      explanation: clean(f.explanation) ?? "",
      confidence: f.confidence,
      suggested_follow_up: isIdea ? null : clean(f.suggested_follow_up),
      owner_label: isIdea ? null : f.owner_label,
      due_date: hasDate ? f.due_date : null,
      due_phrase: hasDate ? f.due_phrase : null,
    });
  }
  return { rows, dropped };
}

/** Owner labels that mean "the user" (current label, plus the legacy one in older data). */
const YOU = new Set(["you", "me", "freelancer"]);

export interface AutoTask {
  finding_id: string;
  title: string;
  owner: string;
  due_date: string | null;
}

/**
 * Promises YOU made on the call become tasks right away, so nothing is
 * forgotten. Client promises stay findings ("waiting on client"). A due date
 * is kept only when one was actually stated.
 */
export function autoTasksFrom(
  findings: { id: string; category: string; owner_label: string | null; title: string; suggested_follow_up: string | null; due_date: string | null }[],
): AutoTask[] {
  return findings
    .filter((f) => f.category === "commitment" && f.owner_label && YOU.has(f.owner_label.trim().toLowerCase()))
    .map((f) => ({
      finding_id: f.id,
      title: (f.suggested_follow_up?.trim() || f.title).slice(0, 200),
      owner: "You",
      due_date: f.due_date && /^\d{4}-\d{2}-\d{2}$/.test(f.due_date) ? f.due_date : null,
    }));
}
