// Quote grounding: a finding is only shown with a quote that really appears in
// the transcript. We never display text the model made up.

const SPEAKER_PREFIX = /^\s*[\p{L}][\p{L}\p{N} ._'-]{0,30}:\s+/u;

/** Lowercase letters/digits only, runs of anything else collapsed to one space. Keeps a map back to original indexes. */
function normalizeWithMap(text: string): { norm: string; map: number[] } {
  let norm = "";
  const map: number[] = [];
  let pendingSpace = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/[\p{L}\p{N}]/u.test(ch)) {
      if (pendingSpace && norm.length > 0) {
        norm += " ";
        map.push(i - 1);
      }
      pendingSpace = false;
      norm += ch.toLowerCase();
      map.push(i);
    } else {
      pendingSpace = true;
    }
  }
  return { norm, map };
}

const MIN_QUOTE_CHARS = 8;

/**
 * Returns the verbatim span of `transcript` that the model's `quote` refers to,
 * or null if it can't be found. Matching ignores case, punctuation and
 * whitespace differences, but the RETURNED text is always the transcript's
 * own characters.
 */
export function groundQuote(quote: string, transcript: string): string | null {
  const trimmed = quote.trim();
  if (!trimmed) return null;

  // 1. exact match
  if (transcript.includes(trimmed) && trimmed.length >= MIN_QUOTE_CHARS) return trimmed;

  // 2. normalized match (also tries the quote without a leading "Client:" label)
  const candidates = [trimmed, trimmed.replace(SPEAKER_PREFIX, "")];
  const t = normalizeWithMap(transcript);
  for (const c of candidates) {
    const q = normalizeWithMap(c).norm;
    if (q.length < MIN_QUOTE_CHARS) continue;
    const at = t.norm.indexOf(q);
    if (at < 0) continue;
    const start = t.map[at];
    let end = t.map[at + q.length - 1];
    // Keep sentence-ending punctuation that directly follows the match.
    while (end + 1 < transcript.length && /[.?!…"')\]]/.test(transcript[end + 1])) end++;
    return transcript.slice(start, end + 1).trim();
  }
  return null;
}

/** Strip a leading speaker label ("Client: ") for display. */
export function stripSpeaker(line: string): string {
  return line.replace(SPEAKER_PREFIX, "");
}

/** Split a transcript into lines with an optional speaker label. */
export function parseTranscript(transcript: string): { idx: number; speaker: string | null; text: string }[] {
  return transcript
    .split(/\r?\n/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw, idx) => {
      const m = raw.match(SPEAKER_PREFIX);
      return m ? { idx, speaker: m[0].replace(/:\s*$/, "").trim(), text: raw.slice(m[0].length) } : { idx, speaker: null, text: raw };
    });
}

/** Loose containment test used to highlight transcript lines that back a quote. */
export function normalizeForMatch(text: string): string {
  return normalizeWithMap(text).norm;
}

// ----------------------------------------------------------------- amounts
const AMOUNT = /(?:[€$£]\s?\d[\d.,]*|\b\d[\d.,]*\s?(?:€|eur|euros?|usd|dollars?|gbp|pounds?)\b)/gi;
const digitsOf = (s: string) => s.replace(/\D/g, "");

/**
 * Replace any money amount in `text` that appears nowhere in `allowed` with a
 * placeholder, so the app never presents an invented price.
 */
export function redactInventedAmounts(text: string, allowed: string): string {
  const allowedDigits = new Set((allowed.match(AMOUNT) ?? []).map(digitsOf));
  return text.replace(AMOUNT, (m) => (allowedDigits.has(digitsOf(m)) ? m : "[amount not stated]"));
}
