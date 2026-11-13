import { cn } from "@/lib/utils";

/** FollowThrough wordmark: a small "thread" mark + serif name with italic accent */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <svg viewBox="0 0 28 28" className="size-7 shrink-0" aria-hidden>
        <rect x="1" y="1" width="26" height="26" rx="8" fill="var(--ink)" />
        <path
          d="M7 15.5c2.2 0 2.2-5 4.4-5s2.2 7 4.4 7 2.2-4 4.2-4"
          fill="none"
          stroke="var(--dawn)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      {!compact && (
        <span className="font-serif text-[1.35rem] leading-none tracking-tight">
          Follow<em>Through</em>
        </span>
      )}
    </span>
  );
}
