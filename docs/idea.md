# The idea

## One line
**Sera: change requests on autopilot.** It listens to client calls, spots every request outside the agreed scope, and turns it into a change request the client can approve, with the exact words as evidence.

## Who it's for
**Agencies and studios** selling fixed-price client projects: product & dev studios, design & brand studios, and consultancies. (We deliberately don't say "freelancers" in the product or pitch: it sounds small. In the UI the user is simply "you", and transcripts label them `You:`.)

## The problem (how we pitch it)
You have a lot of clients. Calls blur together, you promise something and forget to write the task down, and clients ask for more than you agreed. Extra work rarely arrives in writing; it's said on a call.

## The promise
- **Record the call with one click.**
- **Projects are created automatically and kept separate**, one per client.
- **Everything to do in one list:** promises you make on a call become tasks automatically.
- **Every later call is compared with what came before**, and anything extra the client asks for is flagged, with the exact quote, as a change request to approve.

## The product
1. **Record the call.** The home screen is a Record button (or upload audio, or paste a transcript). Press Stop when the call ends; there is no form to fill in.
2. **The project is set up for you.** Sera separates the voices, works out who the client is, and files the call under the matching project, or creates one from what was actually said (client, deliverables, price, deadline). It tells you when it created a project so you can check or edit the agreement.
3. **Sera compares.** One structured AI pass finds requests, changes, deadlines, and commitments, classifies each against the original agreement, and attaches the exact quote.
4. **You review.** Confirm or correct each finding, add notes, create follow-up tasks.
5. **You ask the client.** Sera drafts a message that *asks* for approval. You send it yourself and record the client's answer by hand.

## Where the value is
The comparison: what the client asks for now versus what was originally agreed. Everything else supports that.
- A client *requesting* something is not you *accepting* it.
- A possible addition is not automatically billable work.
- "Maybe we can add a blog later" is an idea, not a scope change.
- "Actually, make it Monday" corrects an earlier date; it does not silently overwrite the original agreement.
- Every finding is tied to a verbatim quote from the transcript.

## Principles
- **Never invent.** No made-up price, owner, deadline, approval, or contractual obligation. Amounts that were not said are redacted in code.
- **Evidence for everything.** A finding without a quote that exists in the transcript is dropped, not shown.
- **Humans decide.** Every AI finding needs your review. Client approval is only ever recorded by you, by hand, after the client actually says yes.
- **The original agreement is never silently rewritten.** It changes only through an explicit "Edit agreement" action. Discussed changes appear next to it, labeled unconfirmed.
- **Not legal advice.** Findings are never described as legally verified or binding.
- **Private by default.** Per-user data under row-level security. Recording consent is the user's responsibility; the UI reminds them.
- **Honest labeling.** Demo data is always marked Sample. Failed analyses say so and offer Retry.

## Non-goals (for now)
Always-on recording, wearables, invoicing, Stripe payment collection, automatic client emails, CRM, complex project management, Google Calendar, Slack, public client approval portals, speaker diarization of audio.

## Context
Built for the **Unfair Weekend** hackathon. Deadline **2026-11-14 20:00 Europe/Vilnius**; feature freeze about 14:00 that day. See [roadmap.md](roadmap.md).

The idea moved from a general "AI memory" app to this niche after comparing it with funded general recorders (Pocket, Vexo); a narrow, painful, priced problem is a stronger position than a generic memory product.
