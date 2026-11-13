import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
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
