# Roadmap

**Deadline:** 2026-11-14 20:00 Europe/Vilnius. **Feature freeze:** about 14:00 that day; after that, rehearse the 2–3 minute demo and fix bugs only.

| Phase | Scope | Status |
|---|---|---|
| 1a. Design checkpoint | Scaffold, tokens and fonts, shadcn restyled, both navs, recording pill, all screens + login hero on static sample data. Stop for design review before wiring the backend. | Done / in review |
| 1b. Foundation | Supabase clients and auth, migration + RLS, swap sample data for real queries, empty states. | Next |
| 2. Capture and Memory | Recorder, upload, signed uploads, register + process, transcription, recording detail, status polling, retry, delete, daily summary. | Planned |
| 3. Moments and Follow-through | Prompts, schemas, grounding, persistence function, Moments timeline and evidence sheet, Actions review. | Planned |
| 4. Google Calendar | OAuth, encrypted tokens, sync dialog, idempotent insert. Cut first if blocked; internal tasks already work. | Planned |
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
