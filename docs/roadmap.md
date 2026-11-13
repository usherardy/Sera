# Roadmap

**Deadline:** 2026-11-14 20:00 Europe/Vilnius. **Feature freeze:** about 14:00 that day; after that, rehearse the 2 minute demo and fix bugs only.

| Phase | Scope | Status |
|---|---|---|
| 0. Prep | `openai` SDK, Next docs read | Done |
| 1. Projects | Migration 0002, project CRUD, dashboard, project page | Built; migration must be run by hand in Supabase |
| 2. Detection | Transcript input, OpenAI structured analysis, quote grounding, conversation page | Built; live run blocked until OpenAI has credits |
| 3. Review and follow-through | Review drawer, tasks, client message, status tracks | Built; untested live |
| 4. Demo data and eval | Acme sample project, `npm run eval` | Built; eval not yet passing live |
| 5. Record-first flow | Home Record button, upload audio, speaker separation and tagging, auto project match / draft | Built; untested live (needs OpenAI credits) |
| 5b. Visibility | Project "Where it stands" card, Findings page, Add to Google Calendar links, full demo data | Built |
| 5c. "Organize every client" pitch | Auto tasks from promises, baseline first calls, To do page + Home "Up next", walkthrough landing with problem section, demo data refresh | Built (needs migration 0003) |
| 5d. Ask Sera | Prompt bar on Home and project pages, push-to-talk, grounded answers with sources, email drafts | Built; tested live on demo data |
| 6. Polish and deploy | Mobile pass, empty/loading states, Vercel env vars, deploy | Planned |
| 7. Integrations | Notion (tasks and deadlines), Gmail and Outlook (send approved change requests from your inbox), Google Calendar sync (OAuth) | Planned, after the hackathon. Landing page and Settings already mention them, labeled Coming soon; Google Calendar "Add to calendar" links work today |

## Before the demo
1. Run `supabase/migrations/0002_projects.sql` in the Supabase SQL editor (after 0001).
2. Add OpenAI billing credit (the key returned `credit_balance_exhausted`) and confirm `OPENAI_ANALYSIS_MODEL` is a model that supports structured outputs.
3. `npm run eval`, then walk the demo: Settings → Load sample project → Analyze each conversation.
4. Set the Supabase and OpenAI env vars on Vercel.

## Scope decisions
| Decision | Why |
|---|---|
| Paste transcript is the base input | Pasted labels (`Client:`, `Freelancer:`) tell who asked from who agreed. Audio transcription has no speaker labels. |
| Analysis runs inside one request (60 s cap) | Transcripts are short; avoids a job queue and polling. |
| Four tables, client-approval fields on `findings` | Fewer joins than a separate `scope_changes` table, same guarantees. |
| Deterministic client message | Cannot invent a price or approval; works without AI credits. |
| Audio is not kept | The browser uploads to the private `recordings` bucket (avoids Vercel's 4.5 MB body limit); the server transcribes and deletes it. |
| Project draft is confirmed, never auto-saved | Keeps "never invent": the AI pre-fills, the freelancer saves. Unstated prices are dropped in code. |

## P2: not during the hackathon
Always-on recording, wearables, invoicing, Stripe, CRM, complex project management, Slack, public client approval portals. Integrations (Notion, Gmail, Outlook, Google Calendar sync) are phase 7, also after the hackathon.
