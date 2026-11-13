import {
  ArrowRight,
  Brush,
  CalendarDays,
  Code2,
  FolderKanban,
  Mail,
  MessageSquareQuote,
  Mic,
  ScrollText,
  Users,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { IconTile, IntegrationsSection, MarketingFooter, MarketingNav, PrimaryCta, ProblemSection } from "@/components/marketing/shell";
import { Sky } from "@/components/marketing/sky";
import { FindingBadge } from "@/components/projects/project-bits";
import { cn } from "@/lib/utils";

/** A small product preview: transcript with the flagged line, and the finding next to it. */
function ProductPreview() {
  const lines: { who: string; text: string; hit?: boolean }[] = [
    { who: "Client", text: "The contact page looks great." },
    { who: "Client", text: "Can we also add Stripe payments to the website?", hit: true },
    { who: "You", text: "I can look into it, but I'll need to estimate it first." },
  ];
  return (
    <div className="surface-raised flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Kickoff call · Acme Studio</span>
        <span className="rounded-full bg-success/40 px-2.5 py-0.5 text-[0.7rem] font-semibold text-success-dark">Analyzed</span>
      </div>
      <ol className="flex flex-col gap-1 rounded-xl bg-cream/60 p-2">
        {lines.map((l) => (
          <li key={l.text} className={cn("rounded-lg px-3 py-2 text-[0.875rem]", l.hit && "bg-dawn ring-1 ring-purple/25")}>
            <span className="mr-2 font-mono text-[0.65rem] tracking-wide text-ink-muted uppercase">{l.who}</span>
            {l.text}
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-2 rounded-xl border border-cream-dark p-4">
        <div className="flex flex-wrap items-center gap-2">
          <FindingBadge category="potential_scope_addition" />
          <span className="rounded-md bg-warning px-2 py-1 text-xs font-semibold text-warning-dark">Needs your review</span>
        </div>
        <p className="font-semibold">Stripe payment integration</p>
        <p className="text-sm text-ink-muted">
          Agreement: <span className="font-semibold text-ink">Payment integration</span> is listed as not included.
        </p>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: <Mic />, t: "Record or upload", d: "Record in the browser, upload audio, or paste a transcript." },
  { icon: <FolderKanban />, t: "Projects set up for you", d: "Sera files each call under the right client, or creates the project." },
  { icon: <ScrollText />, t: "Checked against the deal", d: "Every request is compared with what was originally agreed." },
  { icon: <MessageSquareQuote />, t: "Exact quotes as proof", d: "Each finding shows the words that were said, never a paraphrase." },
  { icon: <Mail />, t: "Change requests, drafted", d: "A ready-to-send message that asks your client to approve the change." },
  { icon: <CalendarDays />, t: "Tasks and calendar", d: "Turn promises into follow-ups and add them to your calendar." },
];

const AUDIENCE = [
  { icon: <Code2 />, tone: "violet" as const, t: "Product & dev studios", d: "Fixed-price builds where “just one more feature” adds up." },
  { icon: <Brush />, tone: "peach" as const, t: "Design & brand studios", d: "Extra rounds and new deliverables, kept in check." },
  { icon: <Users />, tone: "mint" as const, t: "Consultancies", d: "Scope agreed on calls, captured and confirmed in writing." },
];

const STEPS = [
  { n: "01", t: "Record", d: "Press record on the call." },
  { n: "02", t: "File", d: "Sera finds the client and project." },
  { n: "03", t: "Compare", d: "Requests are checked against the deal." },
  { n: "04", t: "Approve", d: "Your client approves the change request." },
];

export function LandingOverview() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Sky className="pb-24 sm:pb-28">
        <MarketingNav
          links={[
            { href: "#features", label: "Features" },
            { href: "#who", label: "Who it's for" },
            { href: "#how", label: "How it works" },
            { href: "#integrations", label: "Integrations" },
          ]}
        />
        <section className="mx-auto mt-16 grid max-w-6xl items-center gap-12 px-6 sm:mt-24 lg:grid-cols-[1.05fr_1fr]">
          <div className="flex flex-col gap-6">
            <p className="eyebrow">For agencies &amp; studios</p>
            <h1 className="display text-[3.2rem] sm:text-[5rem]">
              Stop doing <em>free</em> work.
            </h1>
            <p className="max-w-lg text-lg text-ink/70 sm:text-xl">
              Sera listens to your client calls, spots every request that isn&apos;t in the agreed scope, and turns it into a change
              request your client can approve.
            </p>
            <div className="flex flex-wrap gap-2">
              <PrimaryCta>
                Get started <ArrowRight />
              </PrimaryCta>
              <a href="#how" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-white/70 backdrop-blur")}>
                How it works
              </a>
            </div>
            <p className="text-sm text-ink/60">No forms to fill in. Nothing is sent to your client without you.</p>
          </div>
          <ProductPreview />
        </section>
      </Sky>

      <main className="flex flex-col gap-28 px-6 pb-24 sm:gap-32">
        <ProblemSection />

        <section id="features" className="mx-auto flex w-full max-w-5xl scroll-mt-24 flex-col gap-10">
          <div className="flex flex-col gap-3">
            <p className="eyebrow">Features</p>
            <h2 className="display text-[2.6rem] sm:text-6xl">
              Everything after <em>“can we also…”</em>
            </h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.t} className="surface flex flex-col gap-3 p-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-dawn text-ink [&_svg]:size-5">{f.icon}</span>
                <p className="text-lg font-semibold">{f.t}</p>
                <p className="text-sm text-ink-muted">{f.d}</p>
              </li>
            ))}
          </ul>
        </section>

        <IntegrationsSection />

        <section id="who" className="mx-auto flex w-full max-w-5xl scroll-mt-24 flex-col gap-10">
          <div className="flex flex-col gap-3">
            <p className="eyebrow">Who it&apos;s for</p>
            <h2 className="display text-[2.6rem] sm:text-6xl">
              Built for <em>fixed-price</em> work.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {AUDIENCE.map((a) => (
              <div key={a.t} className="surface flex items-start gap-4 p-6">
                <IconTile tone={a.tone}>{a.icon}</IconTile>
                <div>
                  <p className="font-semibold">{a.t}</p>
                  <p className="mt-1 text-sm text-ink-muted">{a.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto flex w-full max-w-5xl scroll-mt-24 flex-col gap-10">
          <div className="flex flex-col gap-3">
            <p className="eyebrow">How it works</p>
            <h2 className="display text-[2.6rem] sm:text-6xl">
              From call to <em>approved</em> change.
            </h2>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-card border border-[var(--hairline)] bg-[var(--hairline)] shadow-[var(--sera-shadow-soft)] sm:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} className="flex flex-col gap-2 bg-paper p-6">
                <span className="font-mono text-sm text-ink-muted">{s.n}</span>
                <p className="display text-3xl">{s.t}</p>
                <p className="text-sm text-ink-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto w-full max-w-5xl">
          <Sky className="rounded-panel border border-white/70 px-6 py-16 text-center shadow-[var(--sera-shadow-lift)] sm:py-24">
            <div className="flex flex-col items-center gap-6">
              <h2 className="display text-[2.6rem] sm:text-6xl">
                Protect your <em>next</em> project.
              </h2>
              <p className="text-ink/70">Record your next client call and see what Sera finds.</p>
              <PrimaryCta>
                Get started <ArrowRight />
              </PrimaryCta>
            </div>
          </Sky>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
