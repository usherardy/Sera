# Features

Status key: **Done** (built, on sample data where noted) · **Planned** (designed, not built) · **Cut** (dropped on purpose).
Keep this table current; it is how we see what is left.

## Screens

| Feature | Route | Behavior | Status |
|---|---|---|---|
| Login / hero | `/login` | One-screen hero with serif headline and the sign-in form. Email + password via Supabase Auth; sign-up stores the device timezone. Signed-out visitors are redirected here. | Done (needs "Confirm email" off in Supabase) |
| Home | `/` | Daily Memory card (summary, topics, decisions, outstanding items), top moments preview, items needing review. | Done (sample data) |
| Memory | `/memory` | Recordings grouped by day. | Done (sample data) |
| Recording detail | `/memory/[id]` | Audio player, transcript with timestamps, summary, the moments and commitments from this recording, delete. | Done (sample data) |
| Moments | `/moments` | Timeline of moments with category filters; detail sheet showing the evidence quote and timestamp; dismiss. | Done (sample data) |
| Actions | `/actions` | Commitments in Needs Review / Upcoming / Completed. Edit title, owner, date; approve, dismiss, complete. | Done (sample data) |
| Settings | `/settings` | Timezone ("use this device's"), load/remove sample day, sign out. Google Calendar connect is a disabled placeholder. | Done except Calendar (Phase 4) |

## Capture
| Feature | Behavior | Status |
|---|---|---|
| Record in browser | MediaRecorder (Safari gives mp4, Chrome gives webm). Floating recording pill with live waveform and timer, always visible while recording. Consent notice. | UI done; recording works locally, nothing uploaded |
| Upload a file | Accepts m4a, mp3, wav, webm, ogg, flac, mp4. Max 25 MB. Client-side validation and duration probe. | UI done; upload is a design preview |
| Recording kind | `conversation` or `voice_note`, chosen at capture. In a voice note "I" is the user; in a conversation the owner stays unassigned unless clear. | UI done |
| Processing status | Status lines: Uploading, Transcribing, Finding moments, Completed / Failed with Retry. | Preview only (`previewIngest` fakes the sequence) |

## Intelligence
| Feature | Behavior | Status |
|---|---|---|
| Transcription | Timestamped segments via the transcription model. No fabricated timing: null times show "time unavailable". | Planned |
| Analysis | One structured call per recording: summary, topics, decisions, moments, commitments, each with segment ids, a verbatim quote, and confidence. | Planned |
| Grounding | Server verifies quotes appear in the cited segments; timestamps always derived from segments. | Planned |
| Moment ranking | Decision > commitment > important information > personal note, then confidence. Short previews take the best of each category first. | Done ([lib/ranking.ts](../lib/ranking.ts)) |
| Daily summary | Regenerated per local date from per-recording summaries plus open commitments. | Planned |
| Date resolution | Model gets the recording's local date, weekday, timezone, and a 14-day date grid. | Planned |

## Follow-through
| Feature | Behavior | Status |
|---|---|---|
| Review commitments | Approve / dismiss / edit / mark done. Low confidence and unclear ownership are flagged for review. Saved via `PATCH /api/commitments/[id]` with optimistic updates and rollback. | Done |
| Google Calendar sync | Approved tasks only. Date without time prompts for a time or all-day. Idempotent event id prevents duplicates. | Planned |
| Promise ledger | Each Actions tab splits into **You promised** (owner is me, or unassigned) and **Waiting on others** (someone else owns it). Logic in [lib/ledger.ts](../lib/ledger.ts). | Done (UI, sample data) |
| Check-in reminders | Waiting-on tasks get "Remind me to check in": a calendar event titled "Check in with {name}: {task}" on the due date. Time or all-day is still the user's choice. | UI done; calendar sync Planned (Phase 4) |
| Play the receipt | "Hear it" on moments and tasks plays exactly start_ms → end_ms of the recording ([components/common/play-clip.tsx](../components/common/play-clip.tsx)). Hidden for sample data (no audio). | UI done; needs `GET /api/recordings/[id]/audio` (Phase 2) |
| Close your day | `/close`: one card at a time. Pending promises: Approve (owner check if unassigned), Fix, Not a promise, Decide later. Top 3 moments: Keep / Not important. Ends on "Day closed": your list, waiting on, next up, and one confirmed step adding dated items to Calendar (all-day where no time was said). Home shows the entry card. | Done (UI, sample data) |
| Sample day | Labeled sample data (badge on every item). Settings → Load copies it into the user's today (tasks start in Needs review); Remove deletes every sample row. Fallback for a slow demo network. | Done (`/api/demo/seed`) |

## Privacy and safety
| Feature | Status |
|---|---|
| Per-user RLS on all tables | Done in `0001_init.sql` |
| Private audio bucket, signed URLs | Bucket + per-folder policies done; signed playback URLs in `getRecording` |
| OAuth tokens AES-GCM encrypted, service-role only | Planned |
| Delete recording removes row, audio object, derived rows | Done (`DELETE /api/recordings/[id]`); summary regeneration comes with Phase 2 |

## Cut for the deadline
Server-side chunking (25 MB cap instead), a separate job table (status on `recordings`), the `googleapis` SDK (plain `fetch`), speaker labels. Details in [roadmap.md](roadmap.md).
