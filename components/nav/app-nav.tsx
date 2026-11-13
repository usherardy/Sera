"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { FolderKanban, ListChecks, Mic, Settings } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Record", icon: Mic },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/findings", label: "Findings", icon: ListChecks },
  { href: "/settings", label: "Settings", icon: Settings },
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
  return (
    <div className="sticky top-0 z-30 px-4 pt-3 sm:pt-4">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/65 py-2 pr-2 pl-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_10px_30px_-14px_rgba(20,30,80,0.28)] backdrop-blur-xl backdrop-saturate-150">
        <Link href="/" aria-label="Sera home">
          <Logo />
        </Link>
        <ul className="hidden items-center gap-1 sm:flex">
          {NAV.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "rounded-lg px-3.5 py-2.5 text-[0.6875rem] font-semibold tracking-[0.18em] uppercase transition-colors",
                  isActive(pathname, href) ? "bg-ink/[0.07] text-ink" : "text-ink-muted hover:bg-ink/[0.04] hover:text-ink",
                )}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/settings"
          aria-label="Settings"
          className={cn("rounded-lg p-2 text-ink/70 hover:text-ink sm:hidden", isActive(pathname, "/settings") && "bg-dawn text-ink")}
        >
          <Settings className="size-5" />
        </Link>
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
  return (
    <nav className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 sm:hidden">
      <div className="flex items-center rounded-2xl border border-white/80 bg-white/75 px-1 shadow-[0_10px_30px_-14px_rgba(20,30,80,0.3)] backdrop-blur-xl backdrop-saturate-150">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-[0.625rem] font-semibold tracking-[0.12em] uppercase transition-colors",
                active ? "text-ink" : "text-ink-muted",
              )}
            >
              <span className={cn("flex h-7 w-11 items-center justify-center rounded-full", active && "bg-dawn")}>
                <Icon className="size-[1.15rem]" />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
