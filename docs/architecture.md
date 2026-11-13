# Architecture

Update this file when structure, routes, schema, pipeline, or env vars change.

## Stack
- **Next.js 16** (App Router, React 19.3, Turbopack, Cache Components). `proxy.ts` replaces `middleware.ts`. Read `node_modules/next/dist/docs/` before writing Next code.
- **Tailwind CSS 4**, shadcn-style components on **@base-ui/react**, `lucide-react`, `sonner`.
- **Supabase** (Auth, Postgres with RLS) via `@supabase/ssr`.
- **OpenAI** (`openai` 7.x) chat completions with Zod structured outputs.
- **Zod 4** for request and model-output validation. **tsx** runs the eval script. **npm** is the package manager.
- Hosting: Vercel ([vercel.json](../vercel.json)).

## Flow
```
Add conversation (paste / .txt)
  POST /api/projects/[id]/conversations
    validate → duplicate check → insert conversation (pending)
    runAnalysis():
      atomic claim (status → analyzing; refuses if already running, unless stale > 3 min)
      load project agreement + user timezone
      analyzeConversation()  → OpenAI structured output (summary + findings)
      toFindingRows()        → ground quotes, redact invented amounts, enforce rules
      delete this conversation's unreviewed findings, insert new ones (reviewed/dismissed kept)
      status → completed   (any failure → failed + message, Retry available)
  → page shows findings → review drawer → tasks / client message / client status
```
Analysis runs inside the request (`maxDuration = 60`). There is no queue or polling; refresh is safe because status lives on `conversations.processing_status`.

## Analysis ([lib/projects/analyze.ts](../lib/projects/analyze.ts))
Input: the original agreement, the conversation date and a 14-day date grid in the user's timezone (so "by Friday" resolves correctly), and the transcript. Output (Zod, strict): `summary` and `findings[]` with `category`, `title`, `description`, `source_quote`, `related_scope_item`, `explanation`, `confidence`, `suggested_follow_up`, `owner_label`, `due_phrase`, `due_date`.

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
- `follow_up_tasks`: title, owner, due date, status (`open | done`), optional `finding_id`. (Not named `tasks` to avoid colliding with an existing table.)

The spec's separate `scope_changes` table is folded into `findings` (the review and client-approval columns).

## API (all require sign-in; RLS enforces ownership)
| Route | Purpose |
|---|---|
| `POST /api/projects`, `PATCH/DELETE /api/projects/[id]` | Create, edit agreement, delete |
| `POST /api/projects/[id]/conversations` | Add + analyze (60 s) |
| `POST /api/conversations/[id]/analyze` | Retry / re-run (60 s) |
| `PATCH /api/findings/[id]` | Category, notes, review status, client status, saved message. Client status requires `reviewed` |
| `POST /api/findings/[id]/message` | Generate and save the client confirmation message |
| `POST /api/tasks`, `PATCH/DELETE /api/tasks/[id]` | Follow-up tasks |
| `POST/DELETE /api/demo/seed` | Load / remove the Acme sample project |

## Code layout
```
app/(auth)/login/                       login hero + form
app/(app)/layout.tsx                    top nav (desktop) / bottom nav (mobile)
app/(app)/page.tsx                      redirects to /projects
app/(app)/projects/                     dashboard, [id], [id]/conversations/[conversationId]
app/(app)/settings/                     timezone, sample project, sign out
app/api/                                routes above
components/projects/                    form dialog, add-conversation, analyze button, workspace, finding review, task list, bits
components/common/ ui/ nav/ brand/ settings/
components/capture/                     use-recorder.ts, waveform.tsx (kept for browser recording, Phase 5)
lib/projects/                           types, meta, data, schemas, analyze, run-analysis, process, grounding, message
lib/sample/acme.ts                      demo project + four conversations
lib/viewer.ts, auth.ts, dates.ts, format.ts, supabase/, client/api.ts
scripts/eval-analysis.ts                npm run eval
```

## Environment variables
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`, `OPENAI_ANALYSIS_MODEL`, `OPENAI_TRANSCRIBE_MODEL` (Phase 5), `APP_URL`. Without the Supabase keys the app shows a "not configured" notice instead of crashing.

## Verification
`npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run eval` (needs the key and credits). Grounding and redaction were checked offline against fabricated and drifted quotes.

## Known limits
- Audio is not stored and recording is not built yet; paste a transcript.
- Speaker attribution comes from the labels in the pasted text.
- The model can misjudge scope; every finding is a suggestion for review.
- Analysis is bounded to 60 s and 60,000 transcript characters.
