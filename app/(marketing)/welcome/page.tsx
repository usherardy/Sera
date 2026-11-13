import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ClipboardCheck,
  FileWarning,
  FolderKanban,
  Handshake,
  Lock,
  MessageSquareQuote,
  Mic,
  ScrollText,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { EvidenceQuote } from "@/components/common/layout-bits";
import { Sky } from "@/components/marketing/sky";
import { FindingBadge } from "@/components/projects/project-bits";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "SERA · Stop doing free work",
  description:
    "SERA records your client calls, compares every request with what you originally agreed, and shows the exact words, so scope creep becomes a conversation, not a surprise.",
};

const NAV = [
  { href: "#how", label: "How it works" },
  { href: "#example", label: "Example" },
  { href: "#control", label: "Your control" },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

function IconTile({ children, tone }: { children: React.ReactNode; tone: "violet" | "peach" | "mint" }) {
  const bg = {
    violet: "bg-[linear-gradient(135deg,#8f7cf2_0%,#5aa8f5_100%)]",
    peach: "bg-[linear-gradient(135deg,#ffc58f_0%,#ff9fc4_100%)]",
    mint: "bg-[linear-gradient(135deg,#8fd0ff_0%,#7ee8bf_100%)]",
  }[tone];
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] [&_svg]:size-5", bg)}>
      {children}
    </span>
  );
}

export default function WelcomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* ------------------------------------------------------------ hero */}
      <Sky className="pb-20 sm:pb-28">
        <header className="px-4 pt-4 sm:pt-6">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/45 py-2 pr-2 pl-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_10px_30px_-14px_rgba(20,30,80,0.25)] backdrop-blur-xl backdrop-saturate-150">
            <Link href="/welcome" aria-label="SERA">
              <Logo />
            </Link>
            <ul className="hidden items-center gap-1 md:flex">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="rounded-lg px-3.5 py-2.5 text-[0.6875rem] font-semibold tracking-[0.18em] text-ink-muted uppercase transition-colors hover:bg-ink/[0.05] hover:text-ink">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2">
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
                Sign in
              </Link>
              <Link href="/login?mode=signup" className={buttonVariants({ size: "sm" })}>
                Get started
                <ArrowUpRight />
              </Link>
            </div>
          </nav>
        </header>

        <section className="mx-auto mt-16 flex max-w-6xl flex-col gap-10 px-6 sm:mt-24">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/55 py-1.5 pr-1.5 pl-3.5 text-[0.8125rem] text-ink/80 shadow-[0_6px_18px_-10px_rgba(20,30,80,0.3)] backdrop-blur-md">
            For freelancers &amp; small agencies
            <span className="hidden rounded-full bg-ink px-2.5 py-0.5 font-mono text-[0.65rem] tracking-wider whitespace-nowrap text-white uppercase sm:inline">Scope protection</span>
          </span>

          <div className="grid items-end gap-8 lg:grid-cols-[1.35fr_1fr]">
            <h1 className="display text-[3.4rem] sm:text-[5.25rem] lg:text-[6.25rem]">
              Stop doing <em>free</em> work.
            </h1>
            <div className="flex flex-col gap-6 lg:items-end lg:text-right">
              <p className="max-w-md text-lg text-ink/75">
                SERA records your client calls, compares every request with what you originally agreed, and shows you the exact words, so
                scope creep becomes a conversation, not a surprise.
              </p>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Link href="/login?mode=signup" className={buttonVariants({ size: "lg" })}>
                  Start protecting your projects
                  <ArrowRight />
                </Link>
                <a href="#how" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-white/70 backdrop-blur")}>
                  How it works
                </a>
              </div>
            </div>
          </div>

          <ul className="grid gap-3 rounded-3xl border border-white/70 bg-white/40 p-3 shadow-[0_18px_40px_-24px_rgba(20,30,80,0.35)] backdrop-blur-xl sm:grid-cols-3">
            {[
              { tone: "violet" as const, icon: <Mic />, t: "Record any client call" },
              { tone: "peach" as const, icon: <MessageSquareQuote />, t: "Every change, with proof" },
              { tone: "mint" as const, icon: <ShieldCheck />, t: "Approved before you build" },
            ].map((f) => (
              <li key={f.t} className="flex items-center gap-3.5 rounded-2xl border border-white/80 bg-white/60 px-4 py-4 sm:justify-center">
                <IconTile tone={f.tone}>{f.icon}</IconTile>
                <span className="text-[1.0625rem] font-semibold">{f.t}</span>
              </li>
            ))}
          </ul>
        </section>
      </Sky>

      <main className="flex flex-col gap-24 px-6 pb-24 sm:gap-32">
        {/* ------------------------------------------------------------ problem */}
        <section className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div className="flex flex-col gap-4">
            <Eyebrow>The problem</Eyebrow>
            <h2 className="display text-[2.6rem] sm:text-6xl">
              Scope creep happens <em>out loud</em>.
            </h2>
            <p className="max-w-lg text-lg text-ink-muted">
              On fixed-price projects, the extra work rarely arrives in writing. It arrives on a call, as a friendly &ldquo;can you just…&rdquo;, and
              nobody keeps a reliable record of what was agreed.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: <MessageSquareQuote />, t: "“Can we also add…?”", d: "New requests slip in mid-call and sound small." },
              { icon: <ScrollText />, t: "The deal lives in your memory", d: "The original scope is buried in an email from weeks ago." },
              { icon: <Handshake />, t: "Awkward conversations", d: "“That wasn't in the agreement” is hard to say without proof." },
              { icon: <FileWarning />, t: "Unbilled hours", d: "The extra work gets done anyway, and never invoiced." },
            ].map((p) => (
              <li key={p.t} className="surface flex flex-col gap-2.5 p-5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-dawn text-ink [&_svg]:size-[1.1rem]">{p.icon}</span>
                <p className="font-semibold">{p.t}</p>
                <p className="text-sm text-ink-muted">{p.d}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------------------------------------ how it works */}
        <section id="how" className="mx-auto flex w-full max-w-6xl scroll-mt-24 flex-col gap-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4">
              <Eyebrow>How it works</Eyebrow>
              <h2 className="display text-[2.6rem] sm:text-6xl">
                Press record. <em>That&apos;s it.</em>
              </h2>
            </div>
            <p className="max-w-sm text-ink-muted">No forms before the call. SERA sets everything up; you correct anything afterwards.</p>
          </div>
          <ol className="grid gap-4 md:grid-cols-4">
            {[
              { n: "01", icon: <Mic />, t: "Record the call", d: "Tap record during a client call, or upload audio or a transcript. Audio is deleted after transcription." },
              { n: "02", icon: <FolderKanban />, t: "SERA files it", d: "It separates the voices, works out who the client is, and files the call under the right project, or creates one from what was said." },
              { n: "03", icon: <Sparkles />, t: "Compare with the deal", d: "Every request is checked against the original agreement: possible addition, change, needs clarification, or already included." },
              { n: "04", icon: <ClipboardCheck />, t: "Confirm with the client", d: "Review each finding, add follow-up tasks, and send a ready-made message that asks the client to approve the change." },
            ].map((s) => (
              <li key={s.n} className="surface flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-ink-muted">{s.n}</span>
                  <span className="text-ink/70 [&_svg]:size-5">{s.icon}</span>
                </div>
                <p className="display text-3xl">{s.t}</p>
                <p className="text-sm leading-relaxed text-ink-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ------------------------------------------------------------ example */}
        <section id="example" className="mx-auto grid w-full max-w-6xl scroll-mt-24 gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <div className="flex flex-col gap-4">
            <Eyebrow>What you get</Eyebrow>
            <h2 className="display text-[2.6rem] sm:text-6xl">
              The exact words, next to the <em>deal</em>.
            </h2>
            <p className="max-w-lg text-lg text-ink-muted">
              Every finding comes with the quote from the call and the line of the agreement it touches. SERA only shows quotes that really
              appear in the transcript, and never invents a price, a deadline, or an approval.
            </p>
            <ul className="mt-2 flex flex-col gap-2.5 text-[0.9375rem]">
              {["Possible additions and scope changes", "Deadline changes, without overwriting the original", "Promises you and the client made", "A client message that asks for approval"].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-success text-success-dark">
                    <Check className="size-3.5" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(closest-side,rgba(236,230,255,0.9),rgba(255,233,207,0.5),transparent)]" />
            <div className="surface-raised flex flex-col gap-5 p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <span className="eyebrow">Acme Studio Website · Kickoff call</span>
                <span className="rounded-full border border-ink/10 bg-secondary px-2.5 py-0.5 font-mono text-[0.65rem] tracking-wider text-ink-muted uppercase">Example</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FindingBadge category="potential_scope_addition" />
                <span className="rounded-md bg-warning px-2 py-1 text-xs font-semibold text-warning-dark">Needs your review</span>
              </div>
              <p className="display text-3xl">Stripe payment integration</p>
              <EvidenceQuote meta="Client · 10:02">Can we also add Stripe payments to the website?</EvidenceQuote>
              <div className="rounded-2xl border border-cream-dark bg-cream/70 p-4 text-sm">
                <p className="eyebrow mb-2">Original agreement</p>
                <p>
                  Related item: <span className="font-semibold">Payment integration</span>
                  <span className="ml-2 rounded-md bg-error-bg px-1.5 py-0.5 text-xs font-semibold text-pulse">Listed as not included</span>
                </p>
              </div>
              <p className="text-sm text-ink-muted">
                The freelancer didn&apos;t accept it on the call: they said the extra work needs an estimate first. No price was stated.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className={buttonVariants({ size: "sm" })}>Generate client message</span>
                <span className={buttonVariants({ variant: "outline", size: "sm" })}>Add follow-up task</span>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ before / after */}
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <div className="flex flex-col gap-4 text-center">
            <Eyebrow>Before and after</Eyebrow>
            <h2 className="display text-[2.6rem] sm:text-6xl">
              Same client. Different <em>outcome</em>.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="surface flex flex-col gap-4 p-6">
              <p className="font-semibold text-ink-muted">Without SERA</p>
              {[
                "The agreement is somewhere in your inbox",
                "“Sure, no problem” turns into a week of extra work",
                "You argue from memory about what was said",
                "Changes get built before anyone approves them",
              ].map((t) => (
                <p key={t} className="flex items-start gap-2.5 text-[0.9375rem]">
                  <X className="mt-0.5 size-4 shrink-0 text-pulse" />
                  {t}
                </p>
              ))}
            </div>
            <div className="flex flex-col gap-4 rounded-panel bg-fathom p-6 text-cream shadow-[var(--sera-shadow-lift)]">
              <p className="font-semibold text-cream/70">With SERA</p>
              {[
                "The original agreement is on record for every project",
                "New requests are flagged the moment they're said",
                "Every finding shows the exact words and the line of the deal",
                "Changes are approved by the client before you start",
              ].map((t) => (
                <p key={t} className="flex items-start gap-2.5 text-[0.9375rem]">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#7ee8bf]" />
                  {t}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ control */}
        <section id="control" className="mx-auto flex w-full max-w-6xl scroll-mt-24 flex-col gap-10">
          <div className="flex flex-col gap-4">
            <Eyebrow>You stay in control</Eyebrow>
            <h2 className="display text-[2.6rem] sm:text-6xl">
              SERA suggests. <em>You</em> decide.
            </h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <ClipboardCheck />, t: "Every finding is reviewed by you", d: "A request is never treated as an approval, and a possible addition is never treated as billable work." },
              { icon: <Handshake />, t: "Approvals are recorded by hand", d: "Only you mark a change as approved, after the client actually says yes. Nothing is sent automatically." },
              { icon: <Lock />, t: "Private by default", d: "Projects and calls are private to your account. Audio is deleted once it's transcribed." },
              { icon: <ShieldCheck />, t: "No invented facts", d: "No made-up prices, owners, deadlines or approvals. Findings are suggestions, not legal advice." },
            ].map((c) => (
              <li key={c.t} className="surface flex flex-col gap-3 p-5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-dawn [&_svg]:size-[1.1rem]">{c.icon}</span>
                <p className="font-semibold">{c.t}</p>
                <p className="text-sm text-ink-muted">{c.d}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------------------------------------ CTA */}
        <section className="mx-auto w-full max-w-6xl">
          <Sky className="rounded-panel border border-white/70 px-6 py-16 text-center shadow-[var(--sera-shadow-lift)] sm:py-20">
            <div className="flex flex-col items-center gap-6">
              <h2 className="display max-w-2xl text-[2.6rem] sm:text-6xl">
                Protect your <em>next</em> project.
              </h2>
              <p className="max-w-md text-lg text-ink/75">Record your next client call and see what SERA finds.</p>
              <Link href="/login?mode=signup" className={buttonVariants({ size: "lg" })}>
                Get started
                <ArrowRight />
              </Link>
            </div>
          </Sky>
        </section>
      </main>

      <footer className="border-t border-cream-dark px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-ink-muted sm:flex-row">
          <Logo />
          <p>Built at Unfair Weekend 2026. Findings are suggestions for you to review, not legal advice.</p>
        </div>
      </footer>
    </div>
  );
}
