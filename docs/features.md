# Features

Status key: **Built** (code complete, typechecks and builds) · **Untested live** (needs the Supabase migration and OpenAI credits to verify end to end) · **Planned** · **Cut**.

## Screens

| Feature | Route | Behavior | Status |
|---|---|---|---|
| Landing page | `/welcome` | **Live: the walkthrough version** (`LANDING_VERSION = "walkthrough"`): "Stop doing *free* work." hero with the pitch, an animated demo under it (the call being recorded on the left; on the right each line is sorted by a picker wheel that lands on In scope / Out of scope / Your task, with a tick sound that's on by default and starts on the visitor's first click or tap), a clear problem section ("Lots of clients. Lots to *remember*."), four steps matching the pitch (record with one click, projects kept separate, everything to do in one list, new requests flagged), **Integrations** section (Google Calendar "Available now"; Notion, Gmail, Outlook "Coming soon"; also on the overview version, and in the nav), promise, CTA. Overview version also available. Older notes: "Stop doing *free* work.", for agencies & studios. Sky-and-clouds split hero with a product preview (transcript line → finding), the problem, six features, who it's for (product & dev studios, design & brand studios, consultancies), four-step how it works, closing CTA. Signed-out visitors to `/` land here. A second version, the **walkthrough** (one call told in four illustrated steps), is kept too: preview both at `/welcome/overview` and `/welcome/walkthrough`; `LANDING_VERSION` in `lib/landing.ts` picks which one `/welcome` shows. | Built |
| Login | `/login` | Email + password sign-in / sign-up (Supabase Auth). The Sign in tab is pre-filled with the shared **demo account**, so you just press Sign in (it's created on first use and gets the sample projects). Left side: Agreement, Evidence, Follow-through as small sample cards. `?mode=signup` opens on Create account. | Built |
| Record (home) | `/` | Big Record button, upload audio, or paste transcript. Press Stop and Sera does the rest: transcribe → label speakers → match or create the project → analyze → open the result. Recent projects below. | Built · untested live |
| Projects dashboard | `/projects` | Stats (active projects, changes to review, open follow-ups), project cards (name, client, price, deadline, pending changes), recent activity, New project. | Built · untested live |
| Project detail | `/projects/[id]` | Reads top to bottom in three blocks, no step numbers. **Header:** client, name, fact chips (price, deadline, "Discussed …, not confirmed", calls) and one status line (changes to review or "Nothing to review", waiting on the client, next task). Ask Sera bar. **Scope:** one card, *Agreed* (deliverables, changes approved later, not included) beside *Since then* (each open change as one row: title, short quote, type and call, status pill: Needs your review / Not sent yet / Waiting on client / Client declined; "Also noted" collapsed). **To do:** your tasks, promises with no owner stated, and what the client promised. **Calls:** latest first with summaries. All from stored data, no AI. | Built · untested live |
| Ask Sera | `/` and `/projects/[id]` | Prompt bar: type or say a question about your clients (Home: all clients; project page: that project). Short answer + points + source cards with exact quotes linked to their findings; email requests return an editable draft (Copy, Open in email); never sends, edits or approves anything; says so when the answer isn't in your calls. Suggested questions per page. | Built · tested live on demo data |
| To do | `/todo` | Everything to do across all clients: your open tasks grouped Overdue / Today / This week / Later / No date (project chip, "from call" chip, complete toggle, Add to calendar), changes to review, and what you're waiting on from clients. Home shows "Up next" (5 tasks + changes to review) under the Record button. | Built · needs migration 0003 |
| Findings | `/findings` | Every finding across all projects with filters: Needs review, Awaiting client, All changes, Commitments, Everything. Each opens its review drawer. | Built · untested live |
| Conversation detail | `/projects/[id]/conversations/[cid]` | Transcript with quote highlighting, summary, findings grouped by type, Analyze / Retry / Re-run. Clicking a finding opens the review drawer. | Built · untested live |
| Settings | `/settings` | Integrations (Google Calendar, Gmail and Outlook, Notion: each says what it will do, with a disabled "Coming soon" button), timezone, load / remove demo data, sign out. | Built |

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
| Speaker roles worked out by the AI from context; lines become `Client:` / `Freelancer:` | Built · untested live |
| Auto project: AI files the call under the matching project or creates one from what was said (unstated price/deadline left empty); a banner on the result offers Edit agreement | Built · untested live |
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
| Earlier changes count | Each new call on a project is compared against the original agreement **plus** changes the client already approved (shown as "already in scope, approved earlier"); previously rejected changes are flagged again with a note; changes awaiting an answer are marked as already raised. The original agreement is never edited; the project page lists "Approved since" under it | Built · untested live |
| Failure handling | Failed state with the reason and Retry; stuck analyses show as failed after 3 minutes; empty transcripts rejected | Built · untested live |

## Follow-through
| Feature | Status |
|---|---|
| Review a finding: confirm or correct the category, add notes, mark reviewed, dismiss, restore | Built · untested live |
| **Review drawer layout:** type badge and one plain status (Needs your review / Not sent yet / Waiting on client / Client approved / Client declined / Reviewed / Dismissed, from `findingStatus` in `lib/projects/meta.ts`, shared with the project page), title, the quote, one "Why Sera flagged it" box (explanation, confidence, the agreement item it was compared with). Then **Confirm** / Dismiss, "Ask the client" (Draft the message, Copy, Redraft, the client's answer), Follow-up (tasks). "Wrong type? Change it", "Add a task" and "Add a note" stay folded until opened. No step numbers. | Built |
| Follow-up tasks with owner and due date, complete toggle | Built · untested live |
| **Auto-created tasks:** every promise *you* make on a call becomes a task (date only if stated), tagged "from call". Client promises stay "waiting on client". Re-running an analysis replaces only Sera's untouched open tasks | Built · offline-tested · needs migration 0003 |
| **Baseline call:** the call that created a project sets up its agreement and only lists promises, questions and ideas; every later call is compared against it | Built · offline-tested · needs migration 0003 |
| "Add to calendar" on open tasks and dated commitments: opens Google Calendar with an all-day event pre-filled (no Google sign-in; not a sync) | Built |
| Client confirmation message (deterministic template, asks for approval, no price) with edit and copy | Built · untested live |
| Two status tracks: AI detected → Reviewed, and Not sent → Sent → Client approved / rejected. Client status can only be set after review, by hand | Built · untested live |

## Demo
| Feature | Status |
|---|---|
| Demo data loads automatically the first time an account with no projects opens the home page (once per browser), and from Settings → Load or the home "Load demo data" button: "Acme Studio Website" (€500, 4 conversations) and "Nordic Bakery Rebrand" (€1,200, 2 conversations) with summaries, **pre-written example findings** in every state (needs review, sent, client approved, ideas, commitments, deadline change) and tasks. All labeled Sample; quotes verified against transcripts at load time. "Re-run analysis" replaces a conversation's example findings with live AI output | Built |
| `npm run eval`: runs the four conversations through the real pipeline and asserts the expected findings | Built; not yet passing live (OpenAI account had no credits when last run) |

## Cut / not built
Public client approval links, invoicing, Stripe, CRM, audio storage. **Planned integrations** (mentioned in the UI as Coming soon, not built): Notion tasks and deadlines, sending approved change requests from Gmail or Outlook, two-way Google Calendar sync (OAuth). See [roadmap.md](roadmap.md).
