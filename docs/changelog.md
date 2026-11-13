# Changelog

Newest first. Add an entry for **every** meaningful change, in the same change as the code. Format: `## YYYY-MM-DD` then bullets: what changed and why; note which docs were updated.

## 2026-11-13 (pivot to scope protection)
- Product focus changed from a general AI memory app to **scope protection for freelancers** on fixed-price projects (still named SERA). Rewrote `docs/idea.md`, `features.md`, `architecture.md`, `roadmap.md`.
- Added migration `0002_projects.sql` (projects, conversations, findings, follow_up_tasks, all with RLS; the tasks table is `follow_up_tasks` because a `tasks` relation already existed in the Supabase database). **Must be run manually in Supabase.**
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
