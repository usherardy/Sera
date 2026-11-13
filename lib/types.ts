// Domain types. These mirror the Supabase schema (supabase/migrations) so the
// UI can switch from sample data to real queries without changes.

export type RecordingStatus =
  | "uploaded"
  | "transcribing"
  | "analyzing"
  | "completed"
  | "failed";

export type RecordingKind = "conversation" | "voice_note";

export type MomentCategory =
  | "decision"
  | "commitment"
  | "important_information"
  | "personal_note";

export type Confidence = "low" | "medium" | "high";

export type ApprovalStatus = "pending" | "approved" | "dismissed";
export type CompletionStatus = "open" | "done";

export interface TranscriptSegment {
  id: string;
  idx: number;
  /** null when the transcription model gave no timing for this segment */
  start_ms: number | null;
  end_ms: number | null;
  text: string;
  speaker_label: string | null;
}

export interface Recording {
  id: string;
  title: string;
  kind: RecordingKind;
  /** ISO timestamp of when the recording started */
  recorded_at: string;
  duration_seconds: number | null;
  status: RecordingStatus;
  summary: string | null;
  topics: string[];
  error_message: string | null;
  is_sample: boolean;
}

export interface RecordingDetail extends Recording {
  segments: TranscriptSegment[];
  audio_url: string | null;
}

export interface Moment {
  id: string;
  recording_id: string;
  title: string;
  category: MomentCategory;
  summary: string;
  importance_reason: string;
  start_ms: number | null;
  end_ms: number | null;
  evidence_text: string;
  confidence: Confidence;
  dismissed: boolean;
  is_sample: boolean;
}

export interface Commitment {
  id: string;
  recording_id: string;
  moment_id: string | null;
  title: string;
  description: string | null;
  /** "me", a person's name, or null when ownership is unclear */
  owner_label: string | null;
  /** YYYY-MM-DD, only when a deadline was actually stated */
  due_date: string | null;
  /** local wall-clock time "HH:MM" in the user's timezone, only when stated or chosen */
  due_time: string | null;
  /** the words that were said, e.g. "by Friday" */
  due_phrase: string | null;
  all_day: boolean;
  evidence_text: string;
  start_ms: number | null;
  end_ms: number | null;
  confidence: Confidence;
  approval_status: ApprovalStatus;
  completion_status: CompletionStatus;
  external_event_id: string | null;
  is_sample: boolean;
}

export interface DailySummary {
  local_date: string;
  summary: string;
  key_topics: string[];
  key_decisions: string[];
  notable_info: string[];
  outstanding: string[];
}

/** A moment or commitment joined with the recording it came from. */
export interface WithSource {
  recording: Pick<Recording, "id" | "title" | "recorded_at" | "kind">;
}

export interface DayBundle {
  date: string;
  recordings: Recording[];
  summary: DailySummary | null;
  moments: (Moment & WithSource)[];
  commitments: (Commitment & WithSource)[];
}
