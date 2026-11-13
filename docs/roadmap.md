# Roadmap

**Deadline:** 2026-11-14 20:00 Europe/Vilnius. **Feature freeze:** about 14:00 that day; after that, rehearse the 2–3 minute demo and fix bugs only.

| Phase | Scope | Status |
|---|---|---|
| 1a. Design checkpoint | Scaffold, tokens and fonts, shadcn restyled, both navs, recording pill, all screens + login hero on static sample data. | Done |
| Differentiation UI | Promise ledger, check-in variant, "Hear it" clip button, Close your day flow, all on sample data (see [idea.md](idea.md#positioning)). | Done (UI); wired in phases 2–4 |
| 1b. Foundation | Supabase clients and auth, migration + RLS, real queries, mutation APIs, sample-day seed, sign-in redirect. | Done in code; apply `0001_init.sql` in Supabase to go live |
| 2. Capture and Memory | Recorder, upload, signed uploads, register + process, transcription, recording detail, status polling, retry, delete, daily summary. | Planned |
| 3. Moments and Follow-through | Prompts, schemas, grounding, persistence function; wire Actions, ledger and Close your day to the API. | Planned |
| 4. Google Calendar | OAuth, encrypted tokens, idempotent insert, check-in event titles, Close your day batch add. Cut line: if not working by Saturday 10:00, drop it. | Planned |
| 5. Polish and deploy | Loading/error states, mobile QA on real phones, demo fixtures and seed, Vercel deploy, prod OAuth redirect. | Planned |

## Deliberate scope cuts
| Brief says | We do | Why |
|---|---|---|
| Chunk large files | 25 MB upload cap, no chunking | Needs ffmpeg, which Vercel lacks. Seam left in `transcribe.ts`. |
| Small job table | Status on `recordings` plus atomic claim | Same guarantees, one table fewer. |
| googleapis SDK | Plain `fetch` | Too large for two endpoints. |
| Speaker labels | Nullable `speaker_label`, unused | whisper-1 doesn't diarize. |
| (new) Recording kind | `conversation` / `voice_note` at capture | Without diarization, "I" is only clear in a voice note. |

## Demo dataset
Three scripts the team records on a phone: **R1** launch decision with a correction (Wednesday → Friday), **R2** an unaccepted suggestion plus "investor meeting moved to Thursday", **R3** a voice note with a personal plan and a reminder-worthy task. Outputs are saved as fixtures; Settings → Load sample day seeds them with the Sample badge.

## Open items / user setup
Supabase project (email confirm off), OpenAI key with billing, Google Cloud project with Calendar API and a Testing-mode OAuth client (Phase 4).
