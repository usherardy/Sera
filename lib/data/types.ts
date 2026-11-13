import type { Commitment, DayBundle, Moment, Recording, RecordingDetail, WithSource } from "@/lib/types";

export interface Viewer {
  userId: string | null;
  displayName: string | null;
  timezone: string;
  /** today's local date (YYYY-MM-DD) in the viewer's timezone */
  today: string;
}

export interface RecordingBundle {
  recording: RecordingDetail;
  moments: (Moment & WithSource)[];
  commitments: (Commitment & WithSource)[];
}

export interface DataSource {
  getViewer(): Promise<Viewer>;
  listMoments(opts?: { date?: string }): Promise<(Moment & WithSource)[]>;
  listCommitments(): Promise<(Commitment & WithSource)[]>;
  listRecordingsByDay(): Promise<{ date: string; recordings: Recording[] }[]>;
  getRecording(id: string): Promise<RecordingBundle | null>;
  getDay(date: string): Promise<DayBundle>;
}
