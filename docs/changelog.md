# Changelog

Newest first. Add an entry for **every** meaningful change, in the same change as the code. Format: `## YYYY-MM-DD` then bullets: what changed and why; note which docs were updated.

## 2026-11-13 (fonts)
- Back to the original fonts on the new look: EB Garamond headings with an italic (gradient-tinted) accent word, Figtree body, IBM Plex Mono labels. Plus Jakarta Sans removed.

## 2026-11-13 (new look)
- Redesign inspired by Pexa Studio (aesthetic only): Plus Jakarta Sans, warm white page with soft peach/lavender glows and film grain, white cards with hairline borders and soft shadows, pastel chips, dark gradient buttons, frosted-glass nav with uppercase tracked links, gradient accent word in headings, new logo tile.
- Replaces the Wispr Flow-style look (Garamond/Figtree, 2px borders, offset shadows). Rewrote `docs/design-system.md`; updated the style rule in `AGENTS.md`.

## 2026-11-13 (nav)
- Projects is back in the nav: Record · Projects · Findings · Settings.

## 2026-11-13 (demo data on first visit)
- If the account has no projects, the home page loads the labeled demo data automatically (once per browser, remembered in localStorage) and shows a "Load demo data" button. Lets the app be explored while the OpenAI account has no credits.

## 2026-11-13 (fully automatic capture)
- Record → Stop is now the whole flow: SERA transcribes, works out speaker roles, files the call under the matching project or creates one from what was said, analyzes it, and opens the result. Removed the speaker-tagging, transcript-check and project-confirm steps.
- New `POST /api/intake` replaces `/api/intake/draft`. Unstated price and deadline stay empty; a project with no clear deliverables says so.
- Result page shows "SERA created this project" with Edit agreement. Projects page leads with Record a call; manual setup is a fallback.
- Nav: Record · Findings · Settings.
- Not verified live (OpenAI credits); typecheck, lint, build pass.

## 2026-11-13 (demo data, findings page, calendar)
- Demo data: two labeled sample projects with summaries, pre-written example findings in every state, and tasks, so every screen can be seen without live AI. Re-run analysis replaces example findings with real ones.
- New Findings page (`/findings`) with filters; nav is Record · Projects · Findings · Settings.
- Project page "Where it stands" card built from stored data.
- "Add to calendar" links (Google Calendar pre-filled, no sign-in) on open tasks and dated commitments.
- Docs: features, architecture, roadmap updated.

## 2026-11-13 (record-first flow)
- Home (`/`) is now a Record button: record in the browser, upload audio, or paste a transcript.
- Transcription with speaker separation; the user tags which speaker is the client, and lines become `Client:` / `Freelancer:`.
- The project is set up automatically: SERA matches the call to an existing project or drafts a new agreement from what was said (unstated prices dropped in code), and the freelancer confirms before saving.
- Audio goes browser → private bucket → transcription, then is deleted.
- Nav: Record · Projects · Settings. Updated idea, features, architecture, roadmap, design-system.
- Not verified live (OpenAI credits); typecheck, lint, build pass.

## 2026-11-13 (pivot to scope protection)
- Product focus changed from a general AI memory app to **scope protection for freelancers** on fixed-price projects (still named SERA). Rewrote `docs/idea.md`, `features.md`, `architecture.md`, `roadmap.md`.
- Added migration `0002_projects.sql` (projects, conversations, findings, tasks, all with RLS). **Must be run manually in Supabase.**
- Projects dashboard, project page (original agreement, conversations, scope changes, follow-through), conversation page with quote-highlighted transcript, review drawer.
- OpenAI structured analysis with code-enforced rules: verified quotes only, redacted invented amounts, ideas never get deadlines or tasks.
- Follow-up tasks, deterministic client confirmation message, separate review and client-approval status tracks.
- Acme Studio Website sample project (labeled Sample) and `npm run eval`.
- Removed the old recordings / moments / commitments screens, API routes, and sample day. Nav is now Projects and Settings.
- Not verified live: migration not yet run and the OpenAI key returned `credit_balance_exhausted`, so end-to-end analysis has not been run. Typecheck, lint, build, and offline grounding checks pass.

## 2026-11-13
- Phase 1b: Supabase sign-in (email + password), `proxy.ts` session refresh and sign-in redirect, schema with RLS and a private audio bucket (`supabase/migrations/0001_init.sql`), real queries behind the same data-layer signatures, and APIs to update tasks and moments, delete recordings, and load/remove the sample day. Without Supabase env vars the app stays in design-preview mode, so Vercel keeps working until the vars are added.
- Verified Phase 1b end to end against the real Supabase project (27/27 checks): sign-up creates a profile, sample day load/remove, approvals and owner confirmation persist across reloads, moment dismiss, recording delete cascades, and a second account can't read, update, delete or insert another user's rows, audio, or `integration_secrets`. The live data layer now calls `connection()` before reading the clock, which Cache Components requires.
- Commitments now store a local `due_time` ("HH:MM") instead of a `due_at` timestamp, so a stated time can't shift with UTC.
- Added `.env.example` (git now tracks it; `.env.local` stays ignored). Env names follow Supabase's current keys: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
- Docs updated: architecture, features, roadmap.
- Positioned SERA against Pocket and Fieldy: "they remember what was said; SERA makes sure what was promised gets done." Added the comparison to `idea.md`.
- Built the differentiation UI on sample data: promise ledger (You promised / Waiting on others) in Actions, "Remind me to check in" for others' promises, "Hear it" clip replay on moments and tasks, and Close your day (`/close`) with a Home entry card. Commitment review logic moved into `useCommitments` so both screens share it.
- Fixed: shadcn `dark:` styles followed the OS dark mode (the `@custom-variant dark` line was dropped from `globals.css`), so dark-mode phones got grey tabs and inputs. Restored it.
- Docs updated: idea, features, roadmap, architecture, design-system.
- Phase 1a UI built on static sample data: Home, Memory, Recording detail, Moments, Actions, Settings, Login hero, navs, recording pill, capture sheet (ingest is a design preview).
- Renamed product to SERA (from "FollowThrough") for now.
- Added `docs/` (idea, features, architecture, design system, roadmap, changelog) and the docs-update rule in `AGENTS.md`.
- Pushed `README.md` as the first commit to `usherardy/Sera`.
- Added `vercel.json` pinning the framework to Next.js. The first Vercel deploy failed after a successful build, most likely because the project was created when the repo held only the README and was set to "Other".
- Shared a teammate guide (three demo scripts with speaker parts, recording steps, and a pitch and demo outline) as a Claude Doc outside the repo.
