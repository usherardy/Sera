import Link from "next/link";
import { ArrowDown, ListX, MessageSquarePlus, Users } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { Waveform } from "@/components/capture/waveform";
import { FindingBadge } from "@/components/projects/project-bits";
import { cn } from "@/lib/utils";

/** Frosted nav used on every landing variant. */
export function MarketingNav({ links = [] }: { links?: { href: string; label: string }[] }) {
  return (
    <header className="px-4 pt-4 sm:pt-6">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/45 py-2 pr-2 pl-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_10px_30px_-14px_rgba(20,30,80,0.25)] backdrop-blur-xl backdrop-saturate-150">
        <Link href="/welcome" aria-label="Sera">
          <Logo />
        </Link>
        {links.length > 0 && (
          <ul className="hidden items-center gap-1 md:flex">
            {links.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  className="rounded-lg px-3.5 py-2.5 text-[0.6875rem] font-semibold tracking-[0.18em] text-ink-muted uppercase transition-colors hover:bg-ink/[0.05] hover:text-ink"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        )}
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
  );
}

export function MarketingFooter() {
  return (
    <footer className="px-6 py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 text-sm text-ink-muted">
        <Logo />
        <p>Unfair Weekend 2026</p>
      </div>
    </footer>
  );
}

/** Dark recording pill: the client's words being captured. */
export function RecordingPill({ quote, className }: { quote: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-full bg-[linear-gradient(180deg,#2e2e33_0%,#121214_100%)] py-3 pr-5 pl-4 text-white shadow-[0_0_0_8px_rgba(255,255,255,0.35),0_18px_40px_-16px_rgba(20,30,80,0.6)]",
        className,
      )}
    >
      <span className="relative flex size-2.5 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-flare opacity-75" />
        <span className="relative inline-flex size-2.5 rounded-full bg-flare" />
      </span>
      <Waveform className="h-5 shrink-0" />
      <span className="truncate font-mono text-[0.8125rem]">“{quote}”</span>
    </div>
  );
}

/** The idea in one picture: what the client said → what Sera flags. */
export function HeroDemo() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3">
      <RecordingPill quote="Can we also add Stripe payments?" />
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

export function IconTile({ children, tone }: { children: React.ReactNode; tone: "violet" | "peach" | "mint" }) {
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

export function PrimaryCta({ children = "Get started" }: { children?: React.ReactNode }) {
  return (
    <Link href="/login?mode=signup" className={buttonVariants({ size: "lg" })}>
      {children}
    </Link>
  );
}

/** The problem, stated plainly: three cards under a centered serif heading. */
export function ProblemSection() {
  const cards = [
    { icon: <Users />, t: "Which client asked for what?", d: "Calls blur together when you juggle several clients." },
    { icon: <ListX />, t: "Tasks slip through", d: "You promise something on a call and forget to write it down." },
    { icon: <MessageSquarePlus />, t: "Clients ask for more", d: "“Can you just add…” turns into work you never agreed to." },
  ];
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 text-center">
      <h2 className="display max-w-3xl text-[2.6rem] sm:text-6xl">
        Lots of clients. Lots to <em>remember</em>.
      </h2>
      <div className="grid w-full gap-3 sm:grid-cols-3">
        {cards.map((p) => (
          <div key={p.t} className="surface flex flex-col items-center gap-2.5 px-5 py-6">
            <span className="flex size-10 items-center justify-center rounded-xl bg-dawn [&_svg]:size-5">{p.icon}</span>
            <p className="font-semibold">{p.t}</p>
            <p className="text-sm text-ink-muted">{p.d}</p>
          </div>
        ))}
      </div>
      <p className="text-lg text-ink/70">Sera keeps it all organized for you.</p>
    </section>
  );
}
