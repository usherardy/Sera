# The idea

## One line
SERA is an AI memory and follow-through app. You record audio, and it gives you a daily summary, the moments that mattered, and the commitments you made, which you can approve and push to Google Calendar.

## The problem
People talk all day: meetings, calls, hallway conversations, voice notes to themselves. Decisions get made and promises get given, then forgotten. Notes apps need effort at the moment you have none. Transcripts alone are too long to reread.

## The product
1. **Capture.** Record in the browser (or upload a file) from a phone or laptop.
2. **Understand.** The server transcribes the audio with timestamps, then one structured AI pass produces three outputs from the transcript:
   - **Memory:** a summary of each recording and a daily summary.
   - **Moments:** evidence-backed highlights (decisions, commitments, important information, personal notes).
   - **Actions:** proposed tasks the user reviews. Only approved tasks can go to Google Calendar.
3. **Follow through.** The user approves, edits, or dismisses each proposed task, marks tasks done, and syncs approved ones to Calendar.

## Where the value is
The UI is the easy part. The value is **judgment plus grounding**:
- Telling an accepted commitment from a request or a suggestion.
- Resolving "by Friday" to a real date.
- Treating a mid-conversation correction ("actually, Friday") as an update, not a duplicate.
- Tying every claim to a verbatim transcript quote with a real timestamp.

## Principles
- **Never invent.** No made-up commitments, deadlines, times, or timestamps. If a time was not stated, ask the user or leave it empty.
- **Evidence for everything.** Every moment and commitment links to the quote and the place in the audio it came from.
- **User approves before anything leaves the app.** Nothing syncs to Calendar without approval.
- **No psychological or emotional inference.** The AI reports what was said, not what people felt.
- **Private by default.** Per-user data under row-level security, a private audio bucket, short-lived signed URLs, OAuth tokens encrypted at rest. Recording is always visibly indicated.
- **Honest limits.** Documented caps (e.g. 25 MB uploads), clear failed states with Retry, and sample data always labeled as sample.

## Non-goals (for now)
- Speaker diarization (who said it). The schema has a nullable seam for it.
- Server-side audio chunking for long recordings.
- Wearable capture. The ingest contract is device-agnostic so a wearable can be added later.
- Multi-user or team features.

## Context
Built for the **Unfair Weekend** hackathon. Deadline **2026-11-14 20:00 Europe/Vilnius**; feature freeze about 14:00 that day. See [roadmap.md](roadmap.md).
