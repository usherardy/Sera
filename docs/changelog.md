# Changelog

Newest first. Add an entry for **every** meaningful change, in the same change as the code. Format: `## YYYY-MM-DD` then bullets: what changed and why; note which docs were updated.

## 2026-11-13
- Phase 1a UI built on static sample data: Home, Memory, Recording detail, Moments, Actions, Settings, Login hero, navs, recording pill, capture sheet (ingest is a design preview).
- Renamed product to SERA (from "FollowThrough") for now.
- Added `docs/` (idea, features, architecture, design system, roadmap, changelog) and the docs-update rule in `AGENTS.md`.
- Pushed `README.md` as the first commit to `usherardy/Sera`.
- Added `vercel.json` pinning the framework to Next.js. The first Vercel deploy failed after a successful build, most likely because the project was created when the repo held only the README and was set to "Other".
- Shared a teammate guide (three demo scripts with speaker parts, recording steps, and a pitch and demo outline) as a Claude Doc outside the repo.
