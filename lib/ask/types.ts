import type { FindingCategory } from "@/lib/projects/types";

// Shared by /api/ask and the Ask bar. Sources are resolved on the server from
// stored rows, so quotes, titles and links are never written by the AI.

export type AskSource =
  | { key: string; kind: "finding"; category: FindingCategory; title: string; quote: string; meta: string; href: string }
  | { key: string; kind: "task"; title: string; meta: string; href: string; done: boolean }
  | { key: string; kind: "conversation"; title: string; meta: string; href: string }
  | { key: string; kind: "project"; title: string; meta: string; href: string };

export interface AskDraft {
  /** the client's name, from the project */
  to: string;
  subject: string;
  body: string;
}

export interface AskResponse {
  /** false when the answer isn't in the user's calls */
  found: boolean;
  answer: string;
  points: string[];
  sources: AskSource[];
  /** an email for YOU to review and send; Sera never sends it */
  draft: AskDraft | null;
}
