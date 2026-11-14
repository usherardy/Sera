// Fictional demo project. Every row created from this is marked is_sample = true
// and shows a Sample badge. The conversations are invented for the demo.

export const ACME_PROJECT = {
  name: "Acme Studio Website",
  client_name: "Acme Studio",
  original_description: "A simple brochure website for Acme Studio, a small design studio.",
  agreed_scope: ["Homepage", "Contact page", "Responsive design"],
  exclusions: ["Payment integration", "Customer accounts"],
  fixed_price: 1000,
  currency: "EUR",
  deadline: "2026-11-20",
};

export interface AcmeConversation {
  key: "kickoff" | "review" | "blog" | "deadline";
  title: string;
  /** local time on the day, ISO with offset (Europe/Vilnius, UTC+2 in November) */
  recorded_at: string;
  transcript: string;
}

export const ACME_CONVERSATIONS: AcmeConversation[] = [
  {
    key: "kickoff",
    title: "Kickoff call",
    recorded_at: "2026-11-09T10:00:00+02:00",
    transcript: `You: Thanks for joining, Sarah. I've got the homepage layout ready to show you.
Client: Looks great. Will the homepage look good on phones?
You: Yes, responsive design is part of what we agreed.
Client: Perfect.`,
  },
  {
    // Tuesday: the call Sarah means by "but we talked about it on Tuesday!" in the pitch.
    key: "review",
    title: "Design review: payments and accounts",
    recorded_at: "2026-11-10T15:30:00+02:00",
    transcript: `Client: The contact page looks good. Can we also add Stripe payments to the website?
You: I can look into it, but I'll need to estimate the extra work first.
Client: Sure. We also need customers to have accounts and log in.
You: That wasn't part of our original agreement. I'll prepare an updated proposal.
Client: Okay, thanks for flagging that.`,
  },
  {
    key: "blog",
    title: "Quick sync: future ideas",
    recorded_at: "2026-11-11T09:15:00+02:00",
    transcript: `Client: Everything is on track from our side.
You: Great, I'll send you the staging link soon.
Client: Maybe we can add a blog later.
You: Noted, we can talk about that after launch.`,
  },
  {
    key: "deadline",
    title: "Timeline check-in",
    recorded_at: "2026-11-12T11:00:00+02:00",
    transcript: `You: Just confirming the delivery is still set for the 20th.
Client: Actually, make it Monday, the 23rd. We won't have our copy ready before then.
You: Monday the 23rd works for me. I'll confirm that in writing.
Client: Thanks, that helps a lot.`,
  },
];
