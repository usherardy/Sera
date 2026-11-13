// Fictional demo project. Every row created from this is marked is_sample = true
// and shows a Sample badge. The conversations are invented for the demo.

export const ACME_PROJECT = {
  name: "Acme Studio Website",
  client_name: "Acme Studio",
  original_description: "A simple brochure website for Acme Studio, a small design studio.",
  agreed_scope: ["Homepage", "Contact page", "Responsive design"],
  exclusions: ["Payment integration", "Customer accounts"],
  fixed_price: 500,
  currency: "EUR",
  deadline: "2026-11-20",
};

export interface AcmeConversation {
  key: "stripe" | "login" | "blog" | "deadline";
  title: string;
  /** local time on the day, ISO with offset (Europe/Vilnius, UTC+2 in November) */
  recorded_at: string;
  transcript: string;
}

export const ACME_CONVERSATIONS: AcmeConversation[] = [
  {
    key: "stripe",
    title: "Kickoff call: payments question",
    recorded_at: "2026-11-09T10:00:00+02:00",
    transcript: `Freelancer: Thanks for joining. I've got the homepage layout ready to show you.
Client: Looks great. Can we also add Stripe payments to the website?
Freelancer: I can look into it, but I'll need to estimate the extra work first.
Client: Sure, no rush on that. Also, will the homepage look good on phones?
Freelancer: Yes, responsive design is part of what we agreed.
Client: Perfect.`,
  },
  {
    key: "login",
    title: "Design review: accounts",
    recorded_at: "2026-11-10T15:30:00+02:00",
    transcript: `Client: The contact page looks good. We also need customers to have accounts and log in.
Freelancer: That wasn't part of our original agreement. I'll prepare an updated proposal.
Client: Okay, thanks for flagging that.
Freelancer: I'll keep working on the contact page in the meantime.`,
  },
  {
    key: "blog",
    title: "Quick sync: future ideas",
    recorded_at: "2026-11-11T09:15:00+02:00",
    transcript: `Client: Everything is on track from our side.
Freelancer: Great, I'll send you the staging link soon.
Client: Maybe we can add a blog later.
Freelancer: Noted, we can talk about that after launch.`,
  },
  {
    key: "deadline",
    title: "Timeline check-in",
    recorded_at: "2026-11-12T11:00:00+02:00",
    transcript: `Freelancer: Just confirming the delivery is still set for the 20th.
Client: Actually, make it Monday, the 23rd. We won't have our copy ready before then.
Freelancer: Monday the 23rd works for me. I'll confirm that in writing.
Client: Thanks, that helps a lot.`,
  },
];
