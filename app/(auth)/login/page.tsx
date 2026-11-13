import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { ArrowRight, CalendarPlus, Check, FolderKanban, Plus, Send, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { EvidenceQuote } from "@/components/common/layout-bits";
import { FindingBadge } from "@/components/projects/project-bits";
import { LoginForm } from "./login-form";

/* What Sera keeps for every client, shown as one small example (labeled Sample). */

function AgreementCard() {
  return (
    <div className="surface flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <FolderKanban className="size-4" /> Acme Studio Website
        </span>
        <span className="text-xs text-ink-muted">€500 · due Fri, Nov 20</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {["Homepage", "Contact page", "Responsive design"].map((s) => (
          <span key={s} className="rounded-full border border-cream-dark bg-paper px-2.5 py-1 text-xs font-semibold">
            {s}
          </span>
        ))}
        <span className="rounded-full bg-error-bg px-2.5 py-1 text-xs font-semibold text-pulse">Not included: payments</span>
      </div>
    </div>
  );
}

function EvidenceCard() {
  return (
    <div className="surface flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <FindingBadge category="potential_scope_addition" />
        <span className="text-xs text-ink-muted">Second call</span>
      </div>
      <EvidenceQuote meta="The client, word for word">Can we also add Stripe payments?</EvidenceQuote>
    </div>
  );
}

const chip = "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold [&_svg]:size-3.5";

function FollowThroughCard() {
  return (
    <div className="surface flex flex-col gap-3.5 p-4">
      <div className="flex flex-wrap gap-1.5">
        <span className={`${chip} bg-ink text-white`}>
          <Send /> Ask client to approve
        </span>
        <span className={`${chip} border border-cream-dark bg-paper`}>
          <Plus /> Add a task
        </span>
        <span className={`${chip} border border-cream-dark bg-paper`}>
          <CalendarPlus /> Add to calendar
        </span>
        <span className={`${chip} text-ink-muted`}>
          <X /> Dismiss
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <span>Sent</span>
        <ArrowRight className="size-3" />
        <span className="inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 font-semibold text-success-dark">
          <Check className="size-3" /> Approved by the client
        </span>
      </div>
    </div>
  );
}

const STEPS: { n: string; t: string; d: string; v: ReactNode }[] = [
  { n: "01", t: "Agreement", d: "What you agreed at the start.", v: <AgreementCard /> },
  { n: "02", t: "Evidence", d: "The exact words from the call.", v: <EvidenceCard /> },
  { n: "03", t: "Follow-through", d: "You decide what happens next.", v: <FollowThroughCard /> },
];

function Showcase() {
  return (
    <section aria-label="What Sera keeps for every client" className="relative animate-in fade-in slide-in-from-bottom-3 duration-700">
      <div aria-hidden className="absolute -inset-10 -z-10 rounded-[3rem] bg-[radial-gradient(closest-side,rgba(236,230,255,0.85),rgba(255,233,207,0.45),transparent)]" />
      <ol className="relative flex flex-col gap-7">
        <span aria-hidden className="absolute top-5 bottom-5 left-4 w-px bg-ink/10" />
        {STEPS.map((s) => (
          <li key={s.n} className="relative flex flex-col gap-3 pl-12">
            <span className="absolute top-0.5 left-0 flex size-8 items-center justify-center rounded-full border border-cream-dark bg-paper font-mono text-xs text-ink-muted">
              {s.n}
            </span>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <h2 className="font-serif text-[1.75rem] leading-none">{s.t}</h2>
              <p className="text-sm text-ink-muted">{s.d}</p>
            </div>
            {s.v}
          </li>
        ))}
      </ol>
      <p className="mt-5 pl-12 text-xs text-ink-muted">Sample project, for illustration.</p>
    </section>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-5">
        <Link href="/welcome">
          <Logo />
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-5 py-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <Showcase />

        <section className="surface-raised order-first flex flex-col gap-6 p-6 sm:p-8 lg:order-none">
          <div className="flex flex-col gap-1">
            <h1 className="display text-4xl">
              Welcome <em>back</em>
            </h1>
            <p className="text-sm text-ink-muted">Sign in to see every client, call and change.</p>
          </div>
          <Suspense fallback={<div className="h-80" />}>
            <LoginForm />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
