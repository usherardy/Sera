# Changelog

Newest first. Add an entry for **every** meaningful change, in the same change as the code. Format: `## YYYY-MM-DD` then bullets: what changed and why; note which docs were updated.

## 2026-11-13
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
