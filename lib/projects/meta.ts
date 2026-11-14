import type { ClientStatus, Finding, FindingCategory, ReviewStatus } from "./types";

export interface FindingCategoryMeta {
  label: string;
  /** one line for the review screen */
  hint: string;
  dot: string;
  badge: string;
}

export const FINDING_META: Record<FindingCategory, FindingCategoryMeta> = {
  potential_scope_addition: {
    label: "Possible addition",
    hint: "A deliverable that may not be in the original agreement.",
    dot: "bg-glow",
    badge: "bg-glow/20 text-[#8a4d00]",
  },
  scope_modification: {
    label: "Scope change",
    hint: "An existing requirement appears to have changed.",
    dot: "bg-purple",
    badge: "bg-purple/15 text-[#5b4596]",
  },
  clarification_needed: {
    label: "Needs clarification",
    hint: "Not enough information to say whether this is new.",
    dot: "bg-flare",
    badge: "bg-warning text-warning-dark",
  },
  commitment: {
    label: "Commitment",
    hint: "Someone made an identifiable promise.",
    dot: "bg-signal",
    badge: "bg-signal/35 text-[#8a2a74]",
  },
  existing_scope: {
    label: "Already in scope",
    hint: "The request appears covered by the original agreement.",
    dot: "bg-fathom",
    badge: "bg-fathom/10 text-fathom",
  },
  idea: {
    label: "Idea / maybe later",
    hint: "A suggestion or future wish. Not an agreed change.",
    dot: "bg-ink-muted",
    badge: "bg-secondary text-ink-muted",
  },
};

/** Display order: what the freelancer should look at first. */
export const FINDING_ORDER: FindingCategory[] = [
  "potential_scope_addition",
  "scope_modification",
  "clarification_needed",
  "commitment",
  "existing_scope",
  "idea",
];

/** Categories that can change the deal and so need the freelancer's decision. */
const CHANGE_CATEGORIES: FindingCategory[] = [
  "potential_scope_addition",
  "scope_modification",
  "clarification_needed",
];

export const isChangeCategory = (c: FindingCategory) => CHANGE_CATEGORIES.includes(c);

/** Still waiting on the freelancer to look at it. */
export const needsReview = (f: Pick<Finding, "category" | "review_status">) =>
  isChangeCategory(f.category) && f.review_status === "ai_detected";

/** Reviewed, but the client hasn't said yes or no yet. */
export const awaitingClient = (f: Pick<Finding, "category" | "review_status" | "client_status">) =>
  isChangeCategory(f.category) &&
  f.review_status === "reviewed" &&
  (f.client_status === "not_sent" || f.client_status === "sent");

export const REVIEW_LABEL: Record<ReviewStatus, string> = {
  ai_detected: "AI detected",
  reviewed: "Reviewed",
  dismissed: "Dismissed",
};

export const CLIENT_LABEL: Record<ClientStatus, string> = {
  not_sent: "Not sent",
  sent: "Sent to client",
  approved: "Client approved",
  rejected: "Client rejected",
};

export function formatMoney(amount: number | null, currency: string): string {
  if (amount == null) return "No price set";
  try {
    return new Intl.NumberFormat("en-IE", { style: "currency", currency, maximumFractionDigits: amount % 1 === 0 ? 0 : 2 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export type StatusTone = "review" | "muted" | "waiting" | "approved" | "declined";

export const STATUS_TONE: Record<StatusTone, string> = {
  review: "bg-warning text-warning-dark",
  muted: "bg-secondary text-ink-muted",
  waiting: "bg-dawn text-ink",
  approved: "bg-success text-success-dark",
  declined: "bg-error-bg text-pulse",
};

/** Where a finding is, in plain words (one status instead of separate review and client pills). */
export function findingStatus(f: Pick<Finding, "category" | "review_status" | "client_status">): { label: string; tone: StatusTone } {
  if (f.review_status === "dismissed") return { label: "Dismissed", tone: "muted" };
  if (f.review_status === "ai_detected") return { label: "Needs your review", tone: "review" };
  if (!isChangeCategory(f.category)) return { label: "Reviewed", tone: "approved" };
  if (f.client_status === "not_sent") return { label: "Not sent yet", tone: "muted" };
  if (f.client_status === "sent") return { label: "Waiting on client", tone: "waiting" };
  if (f.client_status === "approved") return { label: "Client approved", tone: "approved" };
  return { label: "Client declined", tone: "declined" };
}
