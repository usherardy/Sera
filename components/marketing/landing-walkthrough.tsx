import { ArrowRight, Check, FolderKanban, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EvidenceQuote } from "@/components/common/layout-bits";
import { IntegrationsSection, MarketingFooter, MarketingNav, PrimaryCta, ProblemSection, RecordingPill } from "@/components/marketing/shell";
import { HeroDemo } from "@/components/marketing/hero-demo";
import { Sky } from "@/components/marketing/sky";
import { FindingBadge } from "@/components/projects/project-bits";
import type { FindingCategory } from "@/lib/projects/types";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- visuals */

function RecordVisual() {
  return (
    <div className="flex flex-col items-center gap-5">
      <RecordingPill quote="So the homepage and contact page, right?" />
      <p className="font-mono text-xs text-ink-muted">Recording · 12:48 · audio deleted after transcription</p>
    </div>
  );
}

function ProjectVisual() {
  return (
    <div className="relative isolate pt-11">
      {/* a second client's project behind, to show projects stay separate */}
      <div className="surface absolute inset-x-6 top-0 -z-10 flex h-24 items-start justify-between px-5 pt-3">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-ink/70">
          <FolderKanban className="size-3.5" /> Nordic Bakery Rebrand
        </span>
        <span className="text-xs text-ink-muted">2 calls · 2 to do</span>
      </div>
      <ProjectCard />
    </div>
  );
}

function ProjectCard() {
  return (
    <div className="surface-raised flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <FolderKanban className="size-4" /> Acme Studio Website
        </span>
        <span className="rounded-full bg-dawn px-2.5 py-1 text-[0.7rem] font-semibold">Created from your call</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-cream/70 p-3">
          <p className="eyebrow">Price</p>
          <p className="font-serif text-2xl">€500</p>
        </div>
        <div className="rounded-xl bg-cream/70 p-3">
          <p className="eyebrow">Deadline</p>
          <p className="font-serif text-2xl">Fri, Nov 20</p>
        </div>
      </div>
      <div>
        <p className="eyebrow mb-2">Agreed</p>
        <div className="flex flex-wrap gap-1.5">
          {["Homepage", "Contact page", "Responsive design"].map((s) => (
            <span key={s} className="rounded-full border border-cream-dark bg-paper px-2.5 py-1 text-xs font-semibold">
              {s}
            </span>
          ))}
          <span className="rounded-full bg-error-bg px-2.5 py-1 text-xs font-semibold text-pulse">Not included: payments</span>
        </div>
      </div>
    </div>
  );
}

const TODOS: { t: string; p: string; due: string; done?: boolean }[] = [
  { t: "Send the updated proposal", p: "Acme Studio", due: "Today" },
  { t: "Send the refined logo", p: "Nordic Bakery", due: "Mon, Nov 16" },
  { t: "Confirm the new date in writing", p: "Acme Studio", due: "No date" },
  { t: "Share the staging link", p: "Acme Studio", due: "Done", done: true },
];

function TodoVisual() {
  return (
    <div className="surface-raised flex flex-col gap-1 p-3">
      <p className="eyebrow px-2 pt-2 pb-1">To do · all clients</p>
      <ul className="divide-y divide-cream-dark">
        {TODOS.map((x) => (
          <li key={x.t} className="flex items-start gap-3 px-2 py-3">
            <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-ink/30", x.done && "bg-fathom text-cream")}>
              {x.done && <Check className="size-3.5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block font-semibold", x.done && "line-through opacity-60")}>{x.t}</span>
              <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-ink/75">{x.p}</span>
                {x.due}
                <span className="rounded-full bg-dawn px-1.5 py-0.5 font-semibold text-ink/70">from call</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const CHECKS: { c: FindingCategory; t: string; q: string }[] = [
  { c: "potential_scope_addition", t: "Stripe payments", q: "Can we also add Stripe payments?" },
  { c: "scope_modification", t: "Deadline moved to Mon, Nov 23", q: "Actually, make it Monday, the 23rd." },
  { c: "existing_scope", t: "Works on phones", q: "Will the homepage look good on phones?" },
];

function CompareVisual() {
  return (
    <div className="flex flex-col gap-3">
      <p className="eyebrow">Second call with Acme · compared with your earlier calls</p>
      <CompareList />
      <div className="surface flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-sm font-semibold">Stripe payments: not in your agreement</span>
        <span className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white">Ask client to approve</span>
      </div>
    </div>
  );
}

function CompareList() {
  return (
    <ul className="flex flex-col gap-2.5">
      {CHECKS.map((x) => (
        <li key={x.t} className="surface flex flex-col gap-2 p-4">
          <FindingBadge category={x.c} className="w-fit" />
          <p className="font-semibold">{x.t}</p>
          <p className="border-l-[3px] border-dawn-strong pl-3 font-serif text-[0.95rem] text-ink/75 italic">“{x.q}”</p>
        </li>
      ))}
    </ul>
  );
}

const STEPS = [
  {
    n: "01",
    t: "Record with one click",
    d: "Tap record when the call starts and stop when it ends. You can also upload audio or paste a transcript.",
    v: <RecordVisual />,
  },
  {
    n: "02",
    t: "Projects, created and kept separate",
    d: "Sera works out who the client is and files the call under the right project, or creates a new one from what was said. Every client stays in its own place.",
    v: <ProjectVisual />,
  },
  {
    n: "03",
    t: "Everything to do, in one list",
    d: "Every promise you make on a call becomes a task automatically, with the date if one was said. One list across all your clients.",
    v: <TodoVisual />,
  },
  {
    n: "04",
    t: "New requests, flagged",
    d: "On every later call, Sera compares what the client asks for with what you already agreed, flags anything extra with the exact quote, and drafts a change request for the client to approve.",
    v: <CompareVisual />,
  },
];

/* ---------------------------------------------------------------- page */

export function LandingWalkthrough() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Sky className="pb-24 sm:pb-32">
        <MarketingNav links={[{ href: "#how", label: "How it works" }, { href: "#integrations", label: "Integrations" }, { href: "#promise", label: "Our promise" }]} />
        <section className="mx-auto mt-20 flex max-w-3xl flex-col items-center gap-7 px-6 text-center sm:mt-28">
          <p className="eyebrow">For agencies &amp; studios</p>
          <h1 className="display text-[3.1rem] sm:text-[5.5rem]">
            Stop doing <em>free</em> work.
          </h1>
          <p className="max-w-xl text-lg text-ink/70 sm:text-xl">
            Lots of clients? Sera records each call, keeps every project separate, lists what you need to do, and flags anything a
            client asks for beyond what you agreed.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <PrimaryCta>
              Get started <ArrowRight />
            </PrimaryCta>
            <a href="#how" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-white/70 backdrop-blur")}>
              See how it works
            </a>
          </div>
        </section>
        <div className="mx-auto mt-16 w-full max-w-5xl px-6 sm:mt-20">
          <HeroDemo />
        </div>
      </Sky>

      <main className="flex flex-col gap-28 px-6 pb-24 sm:gap-32">
        <ProblemSection />

        <section id="how" className="mx-auto flex w-full max-w-5xl scroll-mt-24 flex-col gap-16 sm:gap-24">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="display text-[2.6rem] sm:text-6xl">
              One call, <em>four</em> steps.
            </h2>
          </div>
          {STEPS.map((s, i) => (
            <div key={s.n} className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-16">
              <div className={cn("flex flex-col gap-4", i % 2 === 1 && "md:order-2")}>
                <span className="font-mono text-sm text-ink-muted">{s.n}</span>
                <h3 className="display text-4xl sm:text-5xl">{s.t}</h3>
                <p className="max-w-md text-lg leading-relaxed text-ink-muted">{s.d}</p>
              </div>
              <div className="relative min-w-0">
                <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(closest-side,rgba(236,230,255,0.8),rgba(255,233,207,0.45),transparent)]" />
                {s.v}
              </div>
            </div>
          ))}
        </section>

        <IntegrationsSection />

        <section id="promise" className="mx-auto flex w-full max-w-5xl scroll-mt-24 flex-col items-center gap-10">
          <h2 className="display text-center text-[2.6rem] sm:text-6xl">
            Sera suggests. <em>You</em> decide.
          </h2>
          <ul className="grid w-full gap-3 sm:grid-cols-3">
            {["Never invents a price, deadline or approval", "Never treats a request as a yes", "Never sends anything without you"].map((t) => (
              <li key={t} className="surface flex items-center gap-3 px-5 py-4">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-success-dark">
                  <Check className="size-4" />
                </span>
                <span className="font-semibold">{t}</span>
              </li>
            ))}
          </ul>
          <EvidenceQuote meta="Every finding" className="max-w-md">
            Shows the exact words that were said, or it isn&apos;t shown at all.
          </EvidenceQuote>
        </section>

        <section className="mx-auto w-full max-w-5xl">
          <Sky className="rounded-panel border border-white/70 px-6 py-16 text-center shadow-[var(--sera-shadow-lift)] sm:py-24">
            <div className="flex flex-col items-center gap-6">
              <Sparkles className="size-6 text-ink/60" />
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
