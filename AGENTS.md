<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project docs: keep them current (REQUIRED)

SERA's documentation lives in [`docs/`](docs/README.md). **Read the relevant doc before starting work, and update the docs in the same change as the code, every time.** A task is not finished until the docs match.

Before you finish any change, go through this checklist:
1. [`docs/changelog.md`](docs/changelog.md): add a dated entry. Always.
2. [`docs/features.md`](docs/features.md): update the status of any feature you added, changed, finished, or cut.
3. [`docs/architecture.md`](docs/architecture.md): update if you changed routes, schema, data flow, the AI pipeline, code layout, dependencies, or env vars.
4. [`docs/design-system.md`](docs/design-system.md): update if you changed tokens, fonts, or shared UI patterns.
5. [`docs/roadmap.md`](docs/roadmap.md): update if a phase moved or scope was cut or added.
6. [`docs/idea.md`](docs/idea.md): update only if product direction or principles changed.

Rules: docs describe reality, so mark planned things as planned; if code and docs disagree, fix the docs (or the code) before finishing; keep entries short and factual.

## Working conventions
- Package manager is **npm** (not pnpm).
- Match the Wispr Flow-inspired style in [`docs/design-system.md`](docs/design-system.md).
- Never invent data: no made-up commitments, dates, times, or timestamps.
