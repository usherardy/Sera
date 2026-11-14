# Architecture

Update this file when structure, routes, schema, pipeline, or env vars change.

## Stack
- **Next.js 16** (App Router, React 19.3, Turbopack, Cache Components). `proxy.ts` replaces `middleware.ts`. Read `node_modules/next/dist/docs/` before writing Next code.
- **Tailwind CSS 4**, shadcn-style components on **@base-ui/react**, `lucide-react`, `sonner`.
- **Supabase** (Auth, Postgres with RLS) via `@supabase/ssr`.
- **OpenAI** (`openai` 7.x) chat completions with Zod structured outputs.
- **Zod 4** for request and model-output validation. **tsx** runs the eval script. **npm** is the package manager.
- Hosting: Vercel ([vercel.json](../vercel.json)).

## Routing and auth
`proxy.ts` refreshes the Supabase session. Public paths: `/welcome`, `/login`. A signed-out visitor to `/` is sent to `/welcome`; any other protected page goes to `/login`. Signed-in users visiting `/login` go to `/`. Public paths also include `/brand` (logo concepts).

**Demo account:** the login form is pre-filled with `DEMO_EMAIL` / `DEMO_PASSWORD` from `lib/demo-account.ts` (public, not secrets). Submitting with that email calls `POST /api/demo/login`, which signs in with the normal server client (session cookies), creates the user with the admin client on first use (`email_confirm: true`, so no email), and seeds the sample projects if the account has none. Everyone shares this account.

## Capture flow (home page, [components/capture/capture-flow.tsx](../components/capture/capture-flow.tsx))
```
Record (MediaRecorder) or upload audio
  → browser uploads to private bucket recordings/{user_id}/{uuid}.{ext}
  → POST /api/transcribe   (download as the user, gpt-4o-transcribe-diarize → Speaker A/B; fallback OPENAI_TRANSCRIBE_MODEL; object deleted)
  → POST /api/intake  (lib/projects/intake.ts, one request, 120 s):
       AI call 1: speaker roles + matching project or a drafted agreement + title
       label lines Client / Freelancer, create the project if none matched
       insert the conversation → runAnalysis (AI call 2)
  → open the conversation (?created=1 shows "Sera created this project" + Edit agreement)
```
Paste transcript skips the upload and transcription steps.

## Analysis flow
```
Add conversation (paste / .txt / from capture)
  POST /api/projects/[id]/conversations
    validate → duplicate check → insert conversation (pending)
    runAnalysis():
      atomic claim (status → analyzing; refuses if already running, unless stale > 3 min)
      load project agreement + user timezone
      analyzeConversation()  → OpenAI structured output (summary + findings)
      toFindingRows()        → ground quotes, redact invented amounts, enforce rules
      delete this conversation's unreviewed findings (and Sera's open tasks made from them), insert new ones (reviewed/dismissed kept)
      autoTasksFrom(): your commitments → tasks (auto_created)
      status → completed   (any failure → failed + message, Retry available)
  → page shows findings → review drawer → tasks / client message / client status
```
Analysis runs inside the request (`maxDuration = 60`). There is no queue or polling; refresh is safe because status lives on `conversations.processing_status`.

## Analysis ([lib/projects/analyze.ts](../lib/projects/analyze.ts))
Input: the original agreement, **earlier changes on the same project** (reviewed findings from other calls whose client status is approved, rejected or sent, grouped by status), the conversation date and a 14-day date grid in the user's timezone (so "by Friday" resolves correctly), and the transcript. Approved changes count as part of the current scope for the comparison; the stored agreement is never modified. Output (Zod, strict): `summary` and `findings[]` with `category`, `title`, `description`, `source_quote`, `related_scope_item`, `explanation`, `confidence`, `suggested_follow_up`, `owner_label`, `due_phrase`, `due_date`.

The system prompt encodes the product rules (request ≠ approval, no invented price/owner/deadline, ideas are not commitments, approval statements need human verification, corrections replace earlier dates, no legal claims). Model: `OPENAI_ANALYSIS_MODEL` (default `gpt-4o`). Errors are mapped to user-safe messages, including an explicit "no credits left" case.

## Enforcement in code ([lib/projects/process.ts](../lib/projects/process.ts), [grounding.ts](../lib/projects/grounding.ts))
The prompt is not trusted alone:
- `groundQuote` accepts a quote only if it appears in the transcript (exact, or matching ignoring case/punctuation/whitespace); it returns the transcript's own text. No match → the finding is dropped. Quotes under 8 characters are rejected.
- `redactInventedAmounts` replaces any money amount not present in the transcript or the agreement with "[amount not stated]".
- Ideas never keep an owner, deadline, or follow-up. Duplicate (category, quote) pairs collapse. Dates must be `YYYY-MM-DD`.

## Data model ([supabase/migrations/0002_projects.sql](../supabase/migrations/0002_projects.sql))
TypeScript mirror: [lib/projects/types.ts](../lib/projects/types.ts). RLS on every table: `user_id = auth.uid()`. `0001` tables (recordings, moments, …) are legacy and unused.
- `projects`: the **original agreement** (`agreed_scope[]`, `exclusions[]`, `fixed_price`, `currency`, `deadline`, `is_sample`). Changed only by the explicit edit action.
- `conversations`: `transcript`, `source`, `summary`, `recorded_at`, `processing_status` (`pending | analyzing | completed | failed`), `error_message`, `analysis_started_at`.
- `findings`: category (6 values), title, description, `source_quote` (required, verified), optional seconds (null for pasted text), `related_scope_item`, explanation, confidence, suggested follow-up, owner, `due_date`/`due_phrase`, `review_status` (`ai_detected | reviewed | dismissed`), `client_status` (`not_sent | sent | approved | rejected`), notes, `client_message`.
- `tasks`: title, owner, due date, status (`open | done`), optional `finding_id`.

The spec's separate `scope_changes` table is folded into `findings` (the review and client-approval columns).

Migration `0003_baseline_and_auto_tasks.sql` adds `conversations.is_baseline` (the call that set up its project's agreement; analysis runs in baseline mode and never flags scope changes on it) and `tasks.auto_created` (tasks Sera made from your promises; a re-run deletes only those that are still open before re-creating them).

## API (all require sign-in except `/api/demo/login`; RLS enforces ownership)
| Route | Purpose |
|---|---|
| `POST /api/projects`, `PATCH/DELETE /api/projects/[id]` | Create, edit agreement, delete |
| `POST /api/projects/[id]/conversations` | Add + analyze (60 s) |
| `POST /api/conversations/[id]/analyze` | Retry / re-run (60 s) |
| `PATCH /api/findings/[id]` | Category, notes, review status, client status, saved message. Client status requires `reviewed` |
| `POST /api/findings/[id]/message` | Generate and save the client confirmation message |
| `POST /api/tasks`, `PATCH/DELETE /api/tasks/[id]` | Follow-up tasks |
| `POST /api/transcribe` | Transcribe an uploaded recording (own folder only), then delete it (120 s) |
| `POST /api/intake` | From segments or pasted text: label speakers, match or create the project, add and analyze the conversation (120 s) |
| `POST/DELETE /api/demo/seed` | Load / remove demo data (two sample projects with example findings and tasks), via `lib/sample/seed.ts` |
| `POST /api/ask` | Ask Sera: `{question, project_id?}` → answer, points, sources resolved from stored rows, optional email draft (60 s). Read-only |
| `POST /api/ask/transcribe` | A spoken question (multipart `audio`, ≤ 4 MB) → text, via `gpt-4o-mini-transcribe`; audio not stored |
| `POST /api/demo/login` | No sign-in needed: signs in to the shared demo account (creating it on first use) and seeds it when empty |

## Ask Sera ([lib/ask/ask.ts](../lib/ask/ask.ts))
`loadAskData` reads projects, calls (summaries; transcripts only for one project, newest first, up to 40k chars), non-dismissed findings and tasks as the user. `buildAskPrompt` writes them as a DATA block with short refs and statuses in words, plus today's date and a 14-day grid. One structured-output call returns `{found, answer, points, sources: refs, draft}`. The server maps refs back to rows (unknown refs dropped), so quotes, titles and links shown are always the stored ones; amounts not in the data are redacted. Nothing is written.

## Code layout
```
app/(marketing)/welcome/                public landing page (version picked in lib/landing.ts); /overview and /walkthrough preview each
app/(auth)/login/                       sign-in card (demo account pre-filled) + Agreement / Evidence / Follow-through cards
app/(app)/layout.tsx                    top nav (desktop) / bottom nav (mobile)
app/(app)/page.tsx                      home: record flow + recent projects
app/(app)/projects/                     dashboard, [id], [id]/conversations/[conversationId]
app/(app)/findings/                     all findings across projects, filterable
app/(app)/settings/                     timezone, demo data, sign out
app/api/                                routes above
components/projects/                    form dialog, add-conversation, analyze button, workspace, finding review, task list, bits
components/marketing/sky.tsx            original SVG cloud sky backdrop
components/marketing/landing-*.tsx      the two landing versions (overview, walkthrough) + shell.tsx (nav, footer, shared pieces)
components/common/ ui/ nav/ brand/ settings/
components/capture/                     capture-flow.tsx (home record flow), use-recorder.ts, waveform.tsx
lib/projects/                           types, meta, data, schemas, openai, analyze, run-analysis, process, grounding, message, transcribe, draft, intake
lib/sample/acme.ts                      Acme project + four conversations (also used by the eval)
lib/sample/demo.ts                      full demo data: two projects, summaries, example findings, tasks
lib/sample/seed.ts                      seedDemoData(): inserts the demo data for the signed-in user
lib/demo-account.ts                     shared demo account email + password (public)
lib/projects/calendar.ts                Google Calendar "create event" link (no OAuth)
lib/projects/email.ts                   Gmail / Outlook "compose" links with subject + body (no OAuth; Sera sends nothing)
lib/ask/ask.ts                          Ask Sera: loadAskData (RLS), buildAskPrompt (refs P1/C1/F1/T1), askSera, resolveSources
lib/ask/types.ts, limit.ts              shared response types; best-effort per-user rate limit
components/ask/ask-bar.tsx              the prompt bar: text + push-to-talk, suggestions, answer, sources, draft
lib/viewer.ts, auth.ts, dates.ts, format.ts, supabase/, client/api.ts
scripts/eval-analysis.ts                npm run eval
```

## Environment variables
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`, `OPENAI_ANALYSIS_MODEL`, `OPENAI_TRANSCRIBE_MODEL` (fallback when speaker separation is unavailable), `OPENAI_ASK_MODEL` (optional, Ask Sera; defaults to the analysis model), `APP_URL`. Without the Supabase keys the app shows a "not configured" notice instead of crashing.

## Verification
`npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run eval` (needs the key and credits). Grounding and redaction were checked offline against fabricated and drifted quotes.

## Known limits
- Audio is deleted after transcription; only the transcript is kept.
- Speaker attribution comes from the user's tagging (recordings) or the labels in pasted text.
- Recordings are capped at 15 minutes / 25 MB.
- The model can misjudge scope; every finding is a suggestion for review.
- Analysis is bounded to 60 s and 60,000 transcript characters.
