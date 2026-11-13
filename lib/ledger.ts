// The promise ledger: who a commitment belongs to, and how it is scheduled.
// "Yours" = owned by the user, or not yet confirmed (unassigned).
// "Waiting on" = someone else promised it; SERA reminds you to check in.

import type { Commitment } from "@/lib/types";

export function isWaitingOn(owner: string | null): owner is string {
  return !!owner && owner.trim().toLowerCase() !== "me";
}

export function isYours(owner: string | null): boolean {
  return !isWaitingOn(owner);
}

/** Title for the calendar event created from an approved commitment. */
export function calendarEventTitle(c: Pick<Commitment, "title" | "owner_label">): string {
  return isWaitingOn(c.owner_label) ? `Check in with ${c.owner_label}: ${c.title}` : c.title;
}

export function splitLedger<T extends Pick<Commitment, "owner_label">>(items: T[]) {
  return {
    yours: items.filter((c) => isYours(c.owner_label)),
    waitingOn: items.filter((c) => isWaitingOn(c.owner_label)),
  };
}
