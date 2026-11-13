// Labeled demo data. Every row created from this is is_sample = true and shows
// a Sample badge. The findings are PRE-WRITTEN examples so every screen can be
// seen without live AI; "Re-run analysis" replaces them with real AI output.
// Every quote below is copied verbatim from its transcript (checked by the seed).

import type { ClientStatus, Confidence, FindingCategory, ReviewStatus } from "@/lib/projects/types";
import { ACME_CONVERSATIONS, ACME_PROJECT } from "./acme";

export interface SampleFinding {
  conv: string;
  category: FindingCategory;
  title: string;
  description: string;
  quote: string;
  related_scope_item: string | null;
  explanation: string;
  confidence: Confidence;
  suggested_follow_up: string | null;
  owner_label: string | null;
  due_date: string | null;
  due_phrase: string | null;
  review_status?: ReviewStatus;
  client_status?: ClientStatus;
  notes?: string;
  /** generate the client confirmation message for this finding */
  message?: boolean;
}

export interface SampleTask {
  title: string;
  owner: string | null;
  due_date: string | null;
  status: "open" | "done";
  /** title of the finding it belongs to */
  finding?: string;
}

export interface SampleProject {
  project: {
    name: string;
    client_name: string;
    original_description: string;
    agreed_scope: string[];
    exclusions: string[];
    fixed_price: number | null;
    currency: string;
    deadline: string | null;
  };
  conversations: { key: string; title: string; recorded_at: string; transcript: string; summary: string }[];
  findings: SampleFinding[];
  tasks: SampleTask[];
}

const ACME_SUMMARIES: Record<string, string> = {
  stripe: "The freelancer showed the homepage layout. The client asked about adding Stripe payments, and the freelancer said the extra work needs an estimate first. Responsive design was confirmed as already agreed.",
  login: "The client approved the contact page and asked for customer accounts with login. The freelancer said this wasn't in the original agreement and will prepare an updated proposal.",
  blog: "A short status check. The freelancer will share a staging link, and the client floated a blog as a possible later addition.",
  deadline: "The client asked to move delivery from the 20th to Monday the 23rd because their copy isn't ready. The freelancer agreed and will confirm the new date in writing.",
};

const acme: SampleProject = {
  project: ACME_PROJECT,
  conversations: ACME_CONVERSATIONS.map((c) => ({ ...c, summary: ACME_SUMMARIES[c.key] })),
  findings: [
    {
      conv: "stripe",
      category: "potential_scope_addition",
      title: "Stripe payment integration",
      description: "The client asked to add Stripe payments. The freelancer did not accept it; they said the extra work needs an estimate first.",
      quote: "Can we also add Stripe payments to the website?",
      related_scope_item: "Payment integration",
      explanation: "Payment integration is listed as not included in the original agreement, so this would be a change to the scope.",
      confidence: "high",
      suggested_follow_up: "Estimate the Stripe work and ask the client to approve it",
      owner_label: null,
      due_date: null,
      due_phrase: null,
      review_status: "reviewed",
      client_status: "sent",
      notes: "Estimate being prepared. Sent the confirmation message on Nov 10.",
      message: true,
    },
    {
      conv: "stripe",
      category: "existing_scope",
      title: "Homepage works on phones",
      description: "The client asked whether the homepage will look good on phones; the freelancer confirmed it's included.",
      quote: "Also, will the homepage look good on phones?",
      related_scope_item: "Responsive design",
      explanation: "Responsive design is one of the agreed deliverables, so this is not extra work.",
      confidence: "high",
      suggested_follow_up: null,
      owner_label: null,
      due_date: null,
      due_phrase: null,
    },
    {
      conv: "stripe",
      category: "commitment",
      title: "Estimate the extra Stripe work",
      description: "The freelancer committed to estimating the extra work before deciding.",
      quote: "I can look into it, but I'll need to estimate the extra work first.",
      related_scope_item: null,
      explanation: "An identifiable promise by the freelancer. No deadline was stated.",
      confidence: "medium",
      suggested_follow_up: "Send the estimate to the client",
      owner_label: "Freelancer",
      due_date: null,
      due_phrase: null,
    },
    {
      conv: "login",
      category: "potential_scope_addition",
      title: "Customer accounts and login",
      description: "The client asked for customer accounts with login. The freelancer said it wasn't part of the original agreement.",
      quote: "We also need customers to have accounts and log in.",
      related_scope_item: "Customer accounts",
      explanation: "Customer accounts are explicitly listed as not included in the original agreement.",
      confidence: "high",
      suggested_follow_up: "Prepare an updated proposal for customer accounts",
      owner_label: null,
      due_date: null,
      due_phrase: null,
    },
    {
      conv: "login",
      category: "commitment",
      title: "Prepare an updated proposal",
      description: "The freelancer promised an updated proposal. No date was given.",
      quote: "I'll prepare an updated proposal.",
      related_scope_item: null,
      explanation: "An identifiable promise by the freelancer. The deadline is unspecified.",
      confidence: "high",
      suggested_follow_up: "Send the updated proposal",
      owner_label: "Freelancer",
      due_date: null,
      due_phrase: null,
    },
    {
      conv: "blog",
      category: "idea",
      title: "Blog, maybe later",
      description: "The client mentioned a blog as a possible future addition. Nothing was agreed.",
      quote: "Maybe we can add a blog later.",
      related_scope_item: null,
      explanation: "A tentative suggestion for the future, not an agreed scope change. No task or deadline.",
      confidence: "high",
      suggested_follow_up: null,
      owner_label: null,
      due_date: null,
      due_phrase: null,
    },
    {
      conv: "blog",
      category: "commitment",
      title: "Send the staging link",
      description: "The freelancer will share a staging link. \"Soon\" is not a date, so no deadline is set.",
      quote: "I'll send you the staging link soon.",
      related_scope_item: null,
      explanation: "An identifiable promise by the freelancer without a stated date.",
      confidence: "medium",
      suggested_follow_up: "Share the staging link",
      owner_label: "Freelancer",
      due_date: null,
      due_phrase: null,
    },
    {
      conv: "deadline",
      category: "scope_modification",
      title: "Delivery deadline moved to Monday",
      description: "The client corrected the delivery date from the 20th to Monday the 23rd; the freelancer agreed on the call.",
      quote: "Actually, make it Monday, the 23rd.",
      related_scope_item: null,
      explanation: "The original agreement says Fri, Nov 20. This changes it to Mon, Nov 23. The original agreement is not changed until you confirm.",
      confidence: "high",
      suggested_follow_up: "Confirm the new delivery date in writing",
      owner_label: null,
      due_date: "2026-11-23",
      due_phrase: "make it Monday, the 23rd",
    },
    {
      conv: "deadline",
      category: "commitment",
      title: "Confirm the new date in writing",
      description: "The freelancer promised to confirm the new delivery date in writing.",
      quote: "I'll confirm that in writing.",
      related_scope_item: null,
      explanation: "An identifiable promise by the freelancer. No date was stated.",
      confidence: "high",
      suggested_follow_up: "Email the client confirming Monday, Nov 23",
      owner_label: "Freelancer",
      due_date: null,
      due_phrase: null,
    },
  ],
  tasks: [
    { title: "Estimate the Stripe integration work", owner: "Me", due_date: "2026-11-16", status: "open", finding: "Stripe payment integration" },
    { title: "Share the staging link", owner: "Me", due_date: "2026-11-14", status: "open", finding: "Send the staging link" },
    { title: "Show homepage layout to the client", owner: "Me", due_date: "2026-11-09", status: "done" },
  ],
};

const bakery: SampleProject = {
  project: {
    name: "Nordic Bakery Rebrand",
    client_name: "Nordic Bakery",
    original_description: "A brand refresh for a neighbourhood bakery.",
    agreed_scope: ["Logo redesign", "Colour palette", "Business cards"],
    exclusions: ["Website", "Packaging design"],
    fixed_price: 1200,
    currency: "EUR",
    deadline: "2026-11-27",
  },
  conversations: [
    {
      key: "logo",
      title: "Logo concepts review",
      recorded_at: "2026-11-11T14:00:00+02:00",
      transcript: `Client: We love the direction of the logo.
Freelancer: Great. I'll send the refined version on Monday.
Client: Could you also design the labels for our bread bags?
Freelancer: Packaging wasn't part of the brief, so I'd quote that separately.
Client: That's fine, please send me a quote.
Client: And can the business cards be double-sided?
Freelancer: Yes, double-sided cards are included.`,
      summary: "The client liked the logo direction. They asked for bread bag labels, which the freelancer said are packaging and would be quoted separately. Double-sided business cards were confirmed as included.",
    },
    {
      key: "palette",
      title: "Colour palette call",
      recorded_at: "2026-11-12T16:00:00+02:00",
      transcript: `Client: Can we swap the green for a warmer orange?
Freelancer: Sure, I'll update the palette.
Client: Also, I'm not sure if the menu boards are covered.
Freelancer: Let me check what we agreed and get back to you.`,
      summary: "The client asked to swap the green in the palette for a warmer orange, and the freelancer agreed. The client was unsure whether menu boards are covered; the freelancer will check the agreement.",
    },
  ],
  findings: [
    {
      conv: "logo",
      category: "potential_scope_addition",
      title: "Bread bag labels (packaging)",
      description: "The client asked for bread bag labels. The freelancer said packaging wasn't in the brief and offered a separate quote.",
      quote: "Could you also design the labels for our bread bags?",
      related_scope_item: "Packaging design",
      explanation: "Packaging design is listed as not included in the original agreement.",
      confidence: "high",
      suggested_follow_up: "Send a quote for the bread bag labels",
      owner_label: null,
      due_date: null,
      due_phrase: null,
      review_status: "reviewed",
      client_status: "approved",
      notes: "Client approved the separate quote by email on Nov 12.",
      message: true,
    },
    {
      conv: "logo",
      category: "existing_scope",
      title: "Double-sided business cards",
      description: "The client asked for double-sided cards; the freelancer confirmed they're included.",
      quote: "And can the business cards be double-sided?",
      related_scope_item: "Business cards",
      explanation: "Business cards are an agreed deliverable; double-sided printing was confirmed as included.",
      confidence: "medium",
      suggested_follow_up: null,
      owner_label: null,
      due_date: null,
      due_phrase: null,
    },
    {
      conv: "logo",
      category: "commitment",
      title: "Send the refined logo",
      description: "The freelancer promised the refined logo on Monday.",
      quote: "I'll send the refined version on Monday.",
      related_scope_item: "Logo redesign",
      explanation: "An identifiable promise with a stated day, resolved against the call date (Wed, Nov 11).",
      confidence: "high",
      suggested_follow_up: "Send the refined logo",
      owner_label: "Freelancer",
      due_date: "2026-11-16",
      due_phrase: "on Monday",
    },
    {
      conv: "palette",
      category: "scope_modification",
      title: "Palette: green swapped for warm orange",
      description: "The client asked to replace the green with a warmer orange, and the freelancer agreed.",
      quote: "Can we swap the green for a warmer orange?",
      related_scope_item: "Colour palette",
      explanation: "Changes an existing deliverable. The agreement doesn't say how many palette revisions are included, so check whether this counts as extra work.",
      confidence: "medium",
      suggested_follow_up: "Decide whether this revision is included",
      owner_label: null,
      due_date: null,
      due_phrase: null,
    },
    {
      conv: "palette",
      category: "clarification_needed",
      title: "Are menu boards covered?",
      description: "The client wasn't sure whether menu boards are part of the project.",
      quote: "Also, I'm not sure if the menu boards are covered.",
      related_scope_item: null,
      explanation: "Menu boards aren't mentioned in the agreed deliverables or the exclusions, so it isn't clear either way.",
      confidence: "high",
      suggested_follow_up: "Clarify with the client whether menu boards are needed",
      owner_label: null,
      due_date: null,
      due_phrase: null,
    },
    {
      conv: "palette",
      category: "commitment",
      title: "Check the agreement about menu boards",
      description: "The freelancer promised to check what was agreed and get back to the client.",
      quote: "Let me check what we agreed and get back to you.",
      related_scope_item: null,
      explanation: "An identifiable promise by the freelancer without a stated date.",
      confidence: "high",
      suggested_follow_up: "Reply to the client about menu boards",
      owner_label: "Freelancer",
      due_date: null,
      due_phrase: null,
    },
  ],
  tasks: [
    { title: "Send the refined logo", owner: "Me", due_date: "2026-11-16", status: "open", finding: "Send the refined logo" },
    { title: "Quote the bread bag labels", owner: "Me", due_date: "2026-11-12", status: "done", finding: "Bread bag labels (packaging)" },
  ],
};

export const SAMPLE_PROJECTS: SampleProject[] = [acme, bakery];
