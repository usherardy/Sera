import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, ClipboardCheck, Mic, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { Waveform } from "@/components/capture/waveform";
import { Sky } from "@/components/marketing/sky";
import { FindingBadge } from "@/components/projects/project-bits";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "SERA · Stop doing free work",
  description: "SERA listens to your client calls and flags anything that isn't in the deal.",
};

/** The idea in one picture: what the client said → what SERA flags. */
function HeroDemo() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3">
      <div className="flex w-full items-center gap-3 rounded-full bg-[linear-gradient(180deg,#2e2e33_0%,#121214_100%)] py-3 pr-5 pl-4 text-white shadow-[0_0_0_8px_rgba(255,255,255,0.35),0_18px_40px_-16px_rgba(20,30,80,0.6)]">
        <span className="relative flex size-2.5 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-flare opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-flare" />
        </span>
        <Waveform className="h-5 shrink-0" />
        <span className="truncate font-mono text-[0.8125rem]">“Can we also add Stripe payments?”</span>
      </div>
      <ArrowDown className="size-4 text-ink/40" />
      <div className="surface-raised flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
        <div className="flex flex-col gap-1.5">
          <FindingBadge category="potential_scope_addition" className="w-fit" />
          <p className="font-semibold">Not in your agreement</p>
        </div>
        <span className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold whitespace-nowrap text-ink/70">Ask client to approve</span>
      </div>
    </div>
  );
}

const STEPS = [
  { n: "01", icon: <Mic />, t: "Record", d: "Press record on any client call." },
  { n: "02", icon: <Sparkles />, t: "Compare", d: "SERA checks every request against the deal." },
  { n: "03", icon: <ClipboardCheck />, t: "Confirm", d: "Send the change for approval in one tap." },
];

export default function WelcomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Sky className="pb-24 sm:pb-32">
        <header className="px-4 pt-4 sm:pt-6">
          <nav className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/45 py-2 pr-2 pl-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_10px_30px_-14px_rgba(20,30,80,0.25)] backdrop-blur-xl backdrop-saturate-150">
            <Link href="/welcome" aria-label="SERA">
              <Logo />
            </Link>
            <div className="flex items-center gap-1.5">
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
                Sign in
              </Link>
              <Link href="/login?mode=signup" className={buttonVariants({ size: "sm" })}>
                Get started
              </Link>
            </div>
          </nav>
        </header>

        <section className="mx-auto mt-20 flex max-w-3xl flex-col items-center gap-7 px-6 text-center sm:mt-28">
          <p className="eyebrow">For freelancers</p>
          <h1 className="display text-[3.6rem] sm:text-[6.5rem]">
            Stop doing <em>free</em> work.
          </h1>
          <p className="max-w-md text-lg text-ink/70 sm:text-xl">SERA listens to your client calls and flags anything that isn&apos;t in the deal.</p>
          <Link href="/login?mode=signup" className={buttonVariants({ size: "lg" })}>
            Get started
            <ArrowRight />
          </Link>
          <div className="mt-10 w-full">
            <HeroDemo />
          </div>
        </section>
      </Sky>

      <main className="flex flex-col gap-28 px-6 pb-24 sm:gap-36">
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-12">
          <h2 className="display text-center text-[2.6rem] sm:text-6xl">
            Three steps. <em>Zero</em> forms.
          </h2>
          <ol className="grid w-full gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="surface flex flex-col items-center gap-3 px-6 py-8 text-center">
                <span className="flex size-11 items-center justify-center rounded-xl bg-dawn text-ink [&_svg]:size-5">{s.icon}</span>
                <span className="font-mono text-xs text-ink-muted">{s.n}</span>
                <p className="display text-4xl">{s.t}</p>
                <p className="max-w-[14rem] text-[0.9375rem] text-ink-muted">{s.d}</p>
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
              <p className="text-ink/70">Nothing is sent to your client without you.</p>
              <Link href="/login?mode=signup" className={buttonVariants({ size: "lg" })}>
                Get started
                <ArrowRight />
              </Link>
            </div>
          </Sky>
        </section>
      </main>

      <footer className="px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 text-sm text-ink-muted">
          <Logo />
          <p>Unfair Weekend 2026</p>
        </div>
      </footer>
    </div>
  );
}
