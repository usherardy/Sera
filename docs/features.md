# Features

Status key: **Built** (code complete, typechecks and builds) · **Untested live** (needs the Supabase migration and OpenAI credits to verify end to end) · **Planned** · **Cut**.

## Screens

| Feature | Route | Behavior | Status |
|---|---|---|---|
| Login | `/login` | Email + password sign-in / sign-up (Supabase Auth). | Built |
| Record (home) | `/` | Big Record button, upload audio, or paste transcript → tag speakers → check transcript → match or draft the project → analyze. Recent projects below. | Built · untested live |
| Projects dashboard | `/projects` | Stats (active projects, changes to review, open follow-ups), project cards (name, client, price, deadline, pending changes), recent activity, New project. | Built · untested live |
| Project detail | `/projects/[id]` | Header with stats and a "needs review" banner; Original agreement; Conversations; Scope changes; Follow-through (commitments, tasks, awaiting client). | Built · untested live |
| Conversation detail | `/projects/[id]/conversations/[cid]` | Transcript with quote highlighting, summary, findings grouped by type, Analyze / Retry / Re-run. Clicking a finding opens the review drawer. | Built · untested live |
| Settings | `/settings` | Timezone, load / remove the sample project, sign out. Calendar shown as unavailable. | Built |

## Project memory
| Feature | Status |
|---|---|
| Create a project: name, client, description, agreed deliverables, exclusions, fixed price, currency, original deadline | Built |
| Edit the original agreement (explicit action only) | Built |
| Add a conversation by pasting a transcript or uploading a `.txt` | Built · untested live |
| Duplicate transcript in the same project is detected and reused | Built |
| Persistence across sessions (Supabase, RLS) | Untested live |
| Browser recording (live waveform, timer, 15 min cap) and audio upload (25 MB) | Built · untested live |
| Transcription with speaker separation (`gpt-4o-transcribe-diarize`), falling back to plain transcription + manual labels | Built · untested live |
| Tag which speaker is the client / me; labels become `Client:` / `Freelancer:` | Built |
| Auto project: AI matches the call to an existing project or drafts a new agreement from what was said; the freelancer confirms in the form | Built · untested live |
| Audio deleted from storage right after transcription | Built · untested live |

## Scope change detection
| Feature | Behavior | Status |
|---|---|---|
| Categories | Possible addition · Scope change · Needs clarification · Commitment · Already in scope · Idea / maybe later | Built |
| Evidence | Each finding carries a quote verified against the transcript; unverifiable findings are dropped | Built (offline-tested) |
| Comparison | Model sees the original agreement and cites the related scope item | Untested live |
| Rules enforced in code | Ideas get no owner, deadline, or task; amounts not stated are redacted; duplicates collapsed | Built (offline-tested) |
| Deadline corrections | Shown beside the original deadline as "Discussed: … (not confirmed)"; the original is never changed | Built |
| Re-run analysis | Replaces only unreviewed findings; reviewed and dismissed ones are kept | Built · untested live |
| Failure handling | Failed state with the reason and Retry; stuck analyses show as failed after 3 minutes; empty transcripts rejected | Built · untested live |

## Follow-through
| Feature | Status |
|---|---|
| Review a finding: confirm or correct the category, add notes, mark reviewed, dismiss, restore | Built · untested live |
| Follow-up tasks with owner and due date (owner never auto-filled), complete toggle | Built · untested live |
| Client confirmation message (deterministic template, asks for approval, no price) with edit and copy | Built · untested live |
| Two status tracks: AI detected → Reviewed, and Not sent → Sent → Client approved / rejected. Client status can only be set after review, by hand | Built · untested live |

## Demo
| Feature | Status |
|---|---|
| Sample project "Acme Studio Website" (€500, due 20 Nov 2026) with four labeled conversations, loaded unanalyzed so the live AI runs in the demo | Built |
| `npm run eval`: runs the four conversations through the real pipeline and asserts the expected findings | Built; not yet passing live (OpenAI account had no credits when last run) |

## Cut / not built
Public client approval links, automatic emails, invoicing, Stripe, Calendar sync, CRM, audio storage. See [roadmap.md](roadmap.md).
