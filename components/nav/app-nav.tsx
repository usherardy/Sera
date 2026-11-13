"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { CheckSquare, Home, Library, Mic, Settings, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCapture } from "@/components/capture/capture-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/memory", label: "Memory", icon: Library },
  { href: "/moments", label: "Moments", icon: Sparkles },
  { href: "/actions", label: "Actions", icon: CheckSquare },
] as const;

function isActive(pathname: string | null, href: string) {
  if (pathname == null) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// usePathname suspends on routes with request-time params (Cache Components),
// so each nav renders a no-highlight fallback inside Suspense.
export function TopNav() {
  return (
    <Suspense fallback={<TopNavView pathname={null} />}>
      <TopNavLive />
    </Suspense>
  );
}

function TopNavLive() {
  return <TopNavView pathname={usePathname()} />;
}

function TopNavView({ pathname }: { pathname: string | null }) {
  const { openSheet, state } = useCapture();
  const busy = state.phase === "recording";

  return (
    <div className="sticky top-0 z-30 px-4 pt-3 sm:pt-4">
      <nav className="mx-auto grid max-w-5xl grid-cols-[1fr_auto] items-center gap-4 rounded-[0.6rem] border-2 border-cream-dark bg-cream/90 py-2 pr-2 pl-4 backdrop-blur-md sm:grid-cols-[1fr_auto_1fr]">
        <Link href="/" aria-label="FollowThrough home">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 sm:flex">
          {NAV.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-[0.9375rem] font-semibold transition-colors",
                  isActive(pathname, href) ? "bg-dawn text-ink" : "text-ink/70 hover:text-ink",
                )}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-end gap-1.5">
          <Link
            href="/settings"
            aria-label="Settings"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              isActive(pathname, "/settings") && "bg-ink/5",
            )}
          >
            <Settings />
          </Link>
          <Button size="sm" className="hidden sm:inline-flex" onClick={openSheet} disabled={busy}>
            <Mic />
            Record / Upload
          </Button>
        </div>
      </nav>
    </div>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={<BottomNavView pathname={null} />}>
      <BottomNavLive />
    </Suspense>
  );
}

function BottomNavLive() {
  return <BottomNavView pathname={usePathname()} />;
}

function BottomNavView({ pathname }: { pathname: string | null }) {
  const { openSheet, state } = useCapture();
  const busy = state.phase === "recording";
  const [left, right] = [NAV.slice(0, 2), NAV.slice(2)];

  const item = ({ href, label, icon: Icon }: (typeof NAV)[number]) => {
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          "flex flex-1 flex-col items-center gap-1 py-2 text-[0.7rem] font-semibold transition-colors",
          active ? "text-ink" : "text-ink/55",
        )}
      >
        <span className={cn("flex h-7 w-11 items-center justify-center rounded-full", active && "bg-dawn")}>
          <Icon className="size-[1.15rem]" />
        </span>
        {label}
      </Link>
    );
  };

  return (
    <nav className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 sm:hidden">
      <div className="flex items-center rounded-2xl border-2 border-cream-dark bg-cream/95 px-1 backdrop-blur-md">
        {left.map(item)}
        <div className="flex flex-1 justify-center">
          <button
            onClick={openSheet}
            disabled={busy}
            aria-label="Record or upload"
            className="-mt-7 flex size-15 items-center justify-center rounded-full border-2 border-ink bg-ink text-dawn shadow-[0_8px_20px_-8px_rgba(26,26,26,0.6)] transition-transform active:scale-95 disabled:opacity-50"
          >
            <Mic className="size-6" />
          </button>
        </div>
        {right.map(item)}
      </div>
    </nav>
  );
}
