# Features

Status key: **Built** (code complete, typechecks and builds) · **Untested live** (needs the Supabase migration and OpenAI credits to verify end to end) · **Planned** · **Cut**.

## Screens

| Feature | Route | Behavior | Status |
|---|---|---|---|
| Landing page | `/welcome` | "Stop doing *free* work.", for agencies & studios. Sky-and-clouds split hero with a product preview (transcript line → finding), the problem, six features, who it's for (product & dev studios, design & brand studios, consultancies), four-step how it works, closing CTA. Signed-out visitors to `/` land here. A second version, the **walkthrough** (one call told in four illustrated steps), is kept too: preview both at `/welcome/overview` and `/welcome/walkthrough`; `LANDING_VERSION` in `lib/landing.ts` picks which one `/welcome` shows. | Built |
| Login | `/login` | Email + password sign-in / sign-up (Supabase Auth). `?mode=signup` opens on Create account. | Built |
| Record (home) | `/` | Big Record button, upload audio, or paste transcript. Press Stop and Sera does the rest: transcribe → label speakers → match or create the project → analyze → open the result. Recent projects below. | Built · untested live |
| Projects dashboard | `/projects` | Stats (active projects, changes to review, open follow-ups), project cards (name, client, price, deadline, pending changes), recent activity, New project. | Built · untested live |
| Project detail | `/projects/[id]` | Header with stats and a "needs review" banner; **"Where it stands" summary card** (agreed vs. what changed, client responses, discussed deadline, next follow-up, latest call summary; built from stored data, no AI); Original agreement; Conversations; Scope changes; Follow-through. | Built · untested live |
| Findings | `/findings` | Every finding across all projects with filters: Needs review, Awaiting client, All changes, Commitments, Everything. Each opens its review drawer. | Built · untested live |
| Conversation detail | `/projects/[id]/conversations/[cid]` | Transcript with quote highlighting, summary, findings grouped by type, Analyze / Retry / Re-run. Clicking a finding opens the review drawer. | Built · untested live |
| Settings | `/settings` | Timezone, load / remove demo data, sign out. | Built |

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
| Follow-up tasks with owner and due date (owner never auto-filled), complete toggle | Built · untested live |
| "Add to calendar" on open tasks and dated commitments: opens Google Calendar with an all-day event pre-filled (no Google sign-in; not a sync) | Built |
| Client confirmation message (deterministic template, asks for approval, no price) with edit and copy | Built · untested live |
| Two status tracks: AI detected → Reviewed, and Not sent → Sent → Client approved / rejected. Client status can only be set after review, by hand | Built · untested live |

## Demo
| Feature | Status |
|---|---|
| Demo data loads automatically the first time an account with no projects opens the home page (once per browser), and from Settings → Load or the home "Load demo data" button: "Acme Studio Website" (€500, 4 conversations) and "Nordic Bakery Rebrand" (€1,200, 2 conversations) with summaries, **pre-written example findings** in every state (needs review, sent, client approved, ideas, commitments, deadline change) and tasks. All labeled Sample; quotes verified against transcripts at load time. "Re-run analysis" replaces a conversation's example findings with live AI output | Built |
| `npm run eval`: runs the four conversations through the real pipeline and asserts the expected findings | Built; not yet passing live (OpenAI account had no credits when last run) |

## Cut / not built
Public client approval links, automatic emails, invoicing, Stripe, two-way Calendar sync (OAuth), Notion, CRM, audio storage. See [roadmap.md](roadmap.md).
