// Data access for server components. Real Supabase data when it's configured;
// otherwise the clearly labeled sample day (design preview).

import "server-only";
import { SUPABASE_ENABLED } from "@/lib/supabase/config";
import * as sample from "./sample";
import * as live from "./supabase";
import type { DataSource } from "./types";

const source: DataSource = SUPABASE_ENABLED ? live : sample;

export const { getViewer, listMoments, listCommitments, listRecordingsByDay, getRecording, getDay } = source;
export type { Viewer } from "./types";
