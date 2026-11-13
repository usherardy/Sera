import { formatDateOnly } from "@/lib/format";
import type { Finding, Project } from "./types";

/**
 * Client-facing recap that ASKS for approval. Deterministic on purpose: it only
 * restates what is in the finding and the agreement, so it can never invent a
 * price, a deadline or an approval. The freelancer edits it before sending.
 */
export function buildClientMessage(
  project: Pick<Project, "name" | "client_name" | "agreed_scope" | "deadline">,
  f: Pick<Finding, "category" | "title" | "source_quote" | "related_scope_item" | "due_date" | "due_phrase">,
  callDate: string,
): string | null {
  const greeting = `Hi ${project.client_name},`;
  const intro = `Following our conversation on ${callDate}, I want to make sure we're aligned on one point for ${project.name}.`;
  const said = `You mentioned: “${f.source_quote}”`;
  const close = "Could you reply to confirm how you'd like to proceed? Nothing changes in the project until you confirm.\n\nThanks,";

  switch (f.category) {
    case "potential_scope_addition":
      return [
        greeting,
        intro,
        said,
        `This looks like it goes beyond what we originally agreed (${project.agreed_scope.join(", ")}), so I'd like to handle it as a change request. I'll send an estimate of the extra work and any timeline impact separately.`,
        close,
      ].join("\n\n");
    case "scope_modification": {
      const original = f.related_scope_item ? `The original agreement says: “${f.related_scope_item}”.` : "This differs from the original agreement.";
      const date = f.due_date
        ? `The change discussed: ${formatDateOnly(f.due_date)}${f.due_phrase ? ` (“${f.due_phrase}”)` : ""}${project.deadline ? `, instead of the agreed ${formatDateOnly(project.deadline)}` : ""}.`
        : null;
      return [greeting, intro, said, original, date, `Could you confirm that you'd like to change this? Until you confirm, the original agreement stands.\n\nThanks,`]
        .filter(Boolean)
        .join("\n\n");
    }
    case "clarification_needed":
      return [
        greeting,
        intro,
        said,
        "I want to be sure I understand this correctly and whether it's covered by what we originally agreed. Could you clarify what you have in mind?\n\nThanks,",
      ].join("\n\n");
    default:
      return null; // commitments, in-scope items and ideas don't need a client approval request
  }
}
