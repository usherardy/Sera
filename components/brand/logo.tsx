import { cn } from "@/lib/utils";

/** Sera wordmark: a soft lavender tile with a "thread" mark + the serif name */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-ink", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e3e0ff]">
        <svg viewBox="0 0 28 28" className="size-5" aria-hidden>
          <path
            d="M5 15.5c2.4 0 2.4-6 4.8-6s2.4 8.5 4.8 8.5 2.4-5 4.6-5"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {!compact && <span className="font-serif text-[1.55rem] leading-none tracking-[0.01em]">Sera</span>}
    </span>
  );
}
