// Domain types for the scope-protection flow. They mirror
// supabase/migrations/0002_projects.sql.

export type FindingCategory =
  | "potential_scope_addition"
  | "scope_modification"
  | "existing_scope"
  | "clarification_needed"
  | "commitment"
  | "idea";

export type Confidence = "low" | "medium" | "high";
export type ReviewStatus = "ai_detected" | "reviewed" | "dismissed";
export type ClientStatus = "not_sent" | "sent" | "approved" | "rejected";
export type ProcessingStatus = "pending" | "analyzing" | "completed" | "failed";
export type TaskStatus = "open" | "done";
export type ConversationSource = "paste" | "upload" | "recording";

/** The ORIGINAL agreement. Never rewritten by AI output. */
export interface Project {
  id: string;
  name: string;
  client_name: string;
  original_description: string;
  agreed_scope: string[];
  exclusions: string[];
  fixed_price: number | null;
  currency: string;
  /** YYYY-MM-DD */
  deadline: string | null;
  is_sample: boolean;
  created_at: string;
}

export interface ProjectSummary extends Project {
  conversation_count: number;
  /** findings that still need the freelancer's review */
  pending_changes: number;
  open_tasks: number;
}

export interface Conversation {
  id: string;
  project_id: string;
  title: string;
  source: ConversationSource;
  summary: string | null;
  /** ISO timestamp */
  recorded_at: string;
  processing_status: ProcessingStatus;
  error_message: string | null;
  is_sample: boolean;
}

export interface ConversationDetail extends Conversation {
  transcript: string;
}

export interface Finding {
  id: string;
  project_id: string;
  conversation_id: string;
  category: FindingCategory;
  title: string;
  description: string;
  /** verified verbatim against the transcript */
  source_quote: string;
  transcript_start_seconds: number | null;
  transcript_end_seconds: number | null;
  related_scope_item: string | null;
  explanation: string;
  confidence: Confidence;
  suggested_follow_up: string | null;
  /** only when the speaker is known */
  owner_label: string | null;
  /** only when a deadline was actually stated */
  due_date: string | null;
  due_phrase: string | null;
  review_status: ReviewStatus;
  client_status: ClientStatus;
  notes: string | null;
  client_message: string | null;
  is_sample: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  finding_id: string | null;
  title: string;
  owner: string | null;
  due_date: string | null;
  status: TaskStatus;
  is_sample: boolean;
  created_at: string;
}

/** A finding joined with the conversation it came from. */
export interface FindingWithSource extends Finding {
  conversation: Pick<Conversation, "id" | "title" | "recorded_at">;
}
