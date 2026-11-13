# The idea

## One line
SERA protects freelancers from scope creep: it remembers what clients asked for, compares it with what was originally agreed, and shows the exact words as evidence.

## Who it's for
Freelance web developers, designers, and small creative or development agencies (1 to 10 people) working on **fixed-price client projects**.

## The problem
Clients change requirements during calls and chats. Neither side keeps a reliable record of what was originally agreed, what changed, and what still needs approval. The freelancer absorbs the extra work, or has an awkward "that wasn't in the deal" conversation with no proof.

## The product
1. **Record the call.** The home screen is a Record button (or upload audio, or paste a transcript). SERA transcribes it, separates the voices, and you tap which speaker is the client.
2. **The project is set up for you.** SERA matches the call to an existing project, or drafts a new project's agreement (client, deliverables, price, deadline) from what was actually said. You confirm before anything is saved.
3. **SERA compares.** One structured AI pass finds requests, changes, deadlines, and commitments, classifies each against the original agreement, and attaches the exact quote.
4. **You review.** Confirm or correct each finding, add notes, create follow-up tasks.
5. **You ask the client.** SERA drafts a message that *asks* for approval. You send it yourself and record the client's answer by hand.

## Where the value is
The comparison: what the client asks for now versus what was originally agreed. Everything else supports that.
- A client *requesting* something is not the freelancer *accepting* it.
- A possible addition is not automatically billable work.
- "Maybe we can add a blog later" is an idea, not a scope change.
- "Actually, make it Monday" corrects an earlier date; it does not silently overwrite the original agreement.
- Every finding is tied to a verbatim quote from the transcript.

## Principles
- **Never invent.** No made-up price, owner, deadline, approval, or contractual obligation. Amounts that were not said are redacted in code.
- **Evidence for everything.** A finding without a quote that exists in the transcript is dropped, not shown.
- **Humans decide.** Every AI finding needs the freelancer's review. Client approval is only ever recorded by the freelancer, by hand, after the client actually says yes.
- **The original agreement is never silently rewritten.** It changes only through an explicit "Edit agreement" action. Discussed changes appear next to it, labeled unconfirmed.
- **Not legal advice.** Findings are never described as legally verified or binding.
- **Private by default.** Per-user data under row-level security. Recording consent is the freelancer's responsibility; the UI reminds them.
- **Honest labeling.** Demo data is always marked Sample. Failed analyses say so and offer Retry.

## Non-goals (for now)
Always-on recording, wearables, invoicing, Stripe payment collection, automatic client emails, CRM, complex project management, Google Calendar, Slack, public client approval portals, speaker diarization of audio.

## Context
Built for the **Unfair Weekend** hackathon. Deadline **2026-11-14 20:00 Europe/Vilnius**; feature freeze about 14:00 that day. See [roadmap.md](roadmap.md).

The idea moved from a general "AI memory" app to this niche after comparing it with funded general recorders (Pocket, Vexo); a narrow, painful, priced problem is a stronger position than a generic memory product.
