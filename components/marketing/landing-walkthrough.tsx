import { ArrowRight, CalendarDays, Check, FolderKanban, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EvidenceQuote } from "@/components/common/layout-bits";
import { HeroDemo, MarketingFooter, MarketingNav, PrimaryCta, RecordingPill } from "@/components/marketing/shell";
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

const CHECKS: { c: FindingCategory; t: string; q: string }[] = [
  { c: "potential_scope_addition", t: "Stripe payments", q: "Can we also add Stripe payments?" },
  { c: "scope_modification", t: "Deadline moved to Mon, Nov 23", q: "Actually, make it Monday, the 23rd." },
  { c: "existing_scope", t: "Works on phones", q: "Will the homepage look good on phones?" },
];

function CompareVisual() {
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

function ApproveVisual() {
  return (
    <div className="surface-raised flex flex-col gap-4 p-5">
      <p className="eyebrow">Change request to your client</p>
      <div className="rounded-xl bg-cream/70 p-4 text-[0.9rem] leading-relaxed text-ink/85">
        Hi Acme Studio, following our call on 9 November, you mentioned: “Can we also add Stripe payments?” This goes beyond what we
        originally agreed, so I&apos;ll send an estimate separately. Could you confirm how you&apos;d like to proceed?
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="rounded-md bg-success/40 px-2 py-1 text-success-dark">Reviewed</span>
        <ArrowRight className="size-3.5 text-ink/40" />
        <span className="rounded-md bg-dawn px-2 py-1">Sent to client</span>
        <ArrowRight className="size-3.5 text-ink/40" />
        <span className="rounded-md bg-success/40 px-2 py-1 text-success-dark">Client approved</span>
      </div>
      <p className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
        <CalendarDays className="size-3.5" /> Follow-up task added to your calendar
      </p>
    </div>
  );
}

const STEPS = [
  {
    n: "01",
    t: "Record the call",
    d: "Tap record when the call starts and stop when it ends. You can also upload audio or paste a transcript.",
    v: <RecordVisual />,
  },
  {
    n: "02",
    t: "Sera sets up the project",
    d: "It separates the voices, works out who the client is, and files the call under the right project, or creates one from what was said: deliverables, price and deadline.",
    v: <ProjectVisual />,
  },
  {
    n: "03",
    t: "Every request, checked",
    d: "Each request is compared with the original agreement and labeled: possible addition, scope change, needs clarification, or already included. Each comes with the exact quote.",
    v: <CompareVisual />,
  },
  {
    n: "04",
    t: "A change request, ready",
    d: "Review the finding, add a follow-up task, and send a ready-made change request that asks your client to approve. You record their answer.",
    v: <ApproveVisual />,
  },
];

/* ---------------------------------------------------------------- page */

export function LandingWalkthrough() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Sky className="pb-24 sm:pb-32">
        <MarketingNav links={[{ href: "#how", label: "How it works" }, { href: "#promise", label: "Our promise" }]} />
        <section className="mx-auto mt-20 flex max-w-3xl flex-col items-center gap-7 px-6 text-center sm:mt-28">
          <p className="eyebrow">For agencies &amp; studios</p>
          <h1 className="display text-[3.1rem] sm:text-[5.5rem]">
            Stop doing <em>free</em> work.
          </h1>
          <p className="max-w-xl text-lg text-ink/70 sm:text-xl">
            Record your client calls. Sera checks every request against the agreed scope, shows you the exact words, and gets changes
            approved before your team builds them.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <PrimaryCta>
              Get started <ArrowRight />
            </PrimaryCta>
            <a href="#how" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-white/70 backdrop-blur")}>
              See how it works
            </a>
          </div>
          <div className="mt-10 w-full">
            <HeroDemo />
          </div>
        </section>
      </Sky>

      <main className="flex flex-col gap-28 px-6 pb-24 sm:gap-32">
        <section id="how" className="mx-auto flex w-full max-w-5xl scroll-mt-24 flex-col gap-16 sm:gap-24">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="display text-[2.6rem] sm:text-6xl">
              One call, <em>four</em> steps.
            </h2>
          </div>
          {STEPS.map((s, i) => (
            <div key={s.n} className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
              <div className={cn("flex flex-col gap-4", i % 2 === 1 && "md:order-2")}>
                <span className="font-mono text-sm text-ink-muted">{s.n}</span>
                <h3 className="display text-4xl sm:text-5xl">{s.t}</h3>
                <p className="max-w-md text-lg leading-relaxed text-ink-muted">{s.d}</p>
              </div>
              <div className="relative">
                <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(closest-side,rgba(236,230,255,0.8),rgba(255,233,207,0.45),transparent)]" />
                {s.v}
              </div>
            </div>
          ))}
        </section>

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
