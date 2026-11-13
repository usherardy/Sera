# Architecture

Describes the target design and marks what is currently built. Update this file when structure, routes, schema, pipeline, or env vars change.

## Stack
- **Next.js 16** (App Router, React 19.3, Turbopack). This version has breaking changes: read `node_modules/next/dist/docs/` before writing Next code. `proxy.ts` replaces `middleware.ts`.
- **Tailwind CSS 4**, shadcn-style components on **@base-ui/react**, `lucide-react`, `sonner` toasts.
- **Supabase** (Auth, Postgres with RLS, Storage). *Planned.*
- **OpenAI** for transcription and structured analysis. *Planned.*
- **Google Calendar** via plain `fetch` to the REST and OAuth endpoints. *Planned.*
- **Vercel** hosting ([vercel.json](../vercel.json)). Package manager: **npm** (pnpm's corepack shim is broken on the dev machine).

## Current state
**Phase 1a:** the full UI renders from static sample data. No backend is wired. [lib/data/index.ts](../lib/data/index.ts) serves the sample day with the same signatures the Supabase queries will use, so the swap is internal.

## Target data flow
```
Browser ──signed upload──▶ Supabase Storage (private bucket, {uid}/{rid}.ext)
   │
   ├─ POST /api/recordings            register → recordings row (status=uploaded)
   └─ POST /api/recordings/[id]/process
        atomic claim (uploaded|failed → transcribing), respond 202
        after(): transcribe → analyze → persist (one SQL txn) → regenerate daily summary
   client polls /status every 2s → refresh on completed / failed (+Retry)
```
- **Clip playback:** `GET /api/recordings/[id]/audio` (planned) returns `{ url }`, a short-lived signed URL, fetched only when someone taps "Hear it".
- **Device-agnostic ingest:** upload-url → register → process. A future wearable drops a file and calls the same three endpoints.
- **Audio never passes through our API** (Vercel's 4.5 MB body limit). Client uploads directly with a signed URL; playback uses short-lived signed URLs.
- **Background work** runs in `after()` with `maxDuration = 300`. A recording stuck in `transcribing` or `analyzing` over 5 minutes shows as failed with Retry.
- **Writes during processing** use the service-role client after an explicit ownership check. All user-facing reads and writes use the session client under RLS.

## AI pipeline
1. **Transcribe** (`OPENAI_TRANSCRIBE_MODEL`, default `whisper-1`, `verbose_json`). Store `transcript_segments`; null timing stays null.
2. **Analyze** (one call, `OPENAI_ANALYSIS_MODEL`, Structured Outputs with a Zod schema). Input: numbered segments `[S12 03:14–03:20] text`, local date/weekday/timezone, recording kind, 14-day date grid. Output: `{summary, topics, decisions, moments[], commitments[]}`, each item with `segment_ids[]`, verbatim `quote`, `confidence`. Commitments add `owner` (`me` / name / `unassigned`), `due_phrase`, `due_date`, `due_time` (null unless stated).
   Prompt rules: no invented commitments or deadlines; a request or suggestion is not a commitment unless accepted; a correction replaces the earlier item; no emotional inference; empty arrays when nothing applies.
3. **Ground** (`lib/evidence.ts`): quotes must appear in the cited segments, otherwise replaced by segment text with confidence low. `start_ms`/`end_ms` always come from segments. Moments deduped by overlapping segments plus similar title.
4. **Persist:** Postgres function `replace_recording_analysis(recording_id, payload jsonb)` deletes and reinserts derived rows in one transaction, so retries never duplicate. Reprocessing is allowed only from `failed`, so approved tasks are never wiped.
5. **Daily memory:** regenerate `daily_summaries` for the local date from per-recording summaries plus open commitments, never raw transcripts.

## Data model (`supabase/migrations/0001_init.sql`, planned)
TypeScript mirror lives in [lib/types.ts](../lib/types.ts).
- `recordings`: title, kind, recorded_at, duration, status, summary, topics, error_message, mime_type, attempts, processing_started_at, is_sample.
- `transcript_segments`: idx, start_ms, end_ms, text, speaker_label (nullable, unused), user_id.
- `moments`: category (`decision | commitment | important_information | personal_note`), summary, importance_reason, evidence_text, timing, confidence, dismissed.
- `commitments`: title, description, owner_label, due_date, due_at, due_phrase, all_day, evidence, confidence, approval_status (`pending | approved | dismissed`), completion_status (`open | done`), external_event_id.
- `daily_summaries`: unique on `(user_id, local_date)`; summary, key_topics, key_decisions, notable_info, outstanding.
- `integrations` (status, metadata) and `integration_secrets` (RLS on, **no policies**, service role only; AES-GCM tokens).

Derived rows cascade from `recordings`. RLS on every table: `user_id = auth.uid()`. Storage policy: users touch only `{auth.uid()}/` in the private `recordings` bucket.

## Google Calendar
- Connect: `/api/integrations/google/connect` → Google with scope `calendar.events`, `access_type=offline`, `prompt=consent`, CSRF `state` cookie; callback stores the encrypted refresh token.
- Sync approved tasks only. Date without time → user picks a time or confirms all-day.
- Idempotency: event `id` = commitment UUID without dashes (valid base32hex); a repeat insert returns 409, treated as already synced.
- Google app is in Testing mode: add the demo account as a test user; redirect URI lists localhost and the Vercel domain.

## Code layout (current)
```
app/layout.tsx, globals.css        fonts + design tokens (Tailwind v4 @theme)
app/(auth)/login/                  login hero + form
app/(app)/                         layout (nav), page (Home), memory, memory/[id], moments, actions, settings
components/ui/                     shadcn-style primitives (button, dialog, sheet, tabs, input...)
components/nav/app-nav.tsx         floating top nav (desktop) / bottom bar + record button (mobile)
components/capture/                recorder hook, provider, sheet, recording pill, waveform, ingest (preview)
components/home|memory|moments|actions/   feature components
components/actions/use-commitments.tsx   shared commitment state + review actions (Actions, Close your day)
components/close/                  Close your day flow + Home entry card (route: app/(app)/close)
components/common/play-clip.tsx    "Hear it": plays start_ms → end_ms of a recording
components/brand|common/           logo, badges, layout bits
hooks/use-media-query.ts
lib/types.ts                       domain types
lib/data/index.ts                  data access (sample now, Supabase later)
lib/sample/sample-day.ts           labeled sample data
lib/ledger.ts                      yours vs waiting-on, calendar event titles
lib/ranking.ts, categories.ts, format.ts, preview.ts, utils.ts
```
Planned additions: `proxy.ts`, `app/api/**`, `lib/supabase/{server,browser,admin}.ts`, `lib/auth.ts`, `lib/ai/*`, `lib/pipeline/process-recording.ts`, `lib/evidence.ts`, `lib/dates.ts`, `lib/crypto.ts`, `lib/google/{oauth,calendar}.ts`, `supabase/migrations/`, `demo/`, `scripts/eval-analysis.ts`.

## Environment variables (planned)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `OPENAI_TRANSCRIBE_MODEL`, `OPENAI_ANALYSIS_MODEL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `TOKEN_ENCRYPTION_KEY`, `APP_URL`. Document in `.env.example` when added.

## Verification
`npx tsc --noEmit`, `npm run lint`, `npm run build`; planned vitest unit tests (grounding, date grid, schemas, dedupe) and an AI eval on the three demo transcripts; a two-user privacy check.
