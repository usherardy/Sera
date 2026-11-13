import Link from "next/link";
import { ArrowRight, Moon } from "lucide-react";

/** Home entry point for the evening review. */
export function CloseDayCard({ promises, moments }: { promises: number; moments: number }) {
  const parts = [
    promises ? `${promises} promise${promises === 1 ? "" : "s"} to confirm` : null,
    moments ? `${moments} moment${moments === 1 ? "" : "s"} to keep` : null,
  ].filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <Link
      href="/close"
      className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border-2 border-ink bg-ink p-5 text-cream transition-transform active:scale-[0.99] sm:gap-6 sm:p-6"
    >
      <div className="pointer-events-none absolute -top-16 -left-10 size-48 rounded-full bg-dawn/15 blur-3xl" />
      <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-dawn text-ink">
        <Moon className="size-5" />
      </span>
      <span className="relative flex min-w-0 flex-1 flex-col gap-1">
        <span className="display text-3xl">
          Close your <em>day</em>
        </span>
        <span className="text-sm text-cream/75">{parts.join(" · ")} · about a minute</span>
      </span>
      <span className="relative hidden h-11 items-center gap-2 rounded-lg border-2 border-cream bg-dawn px-5 font-semibold text-ink sm:flex">
        Start
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
      <ArrowRight className="relative size-5 shrink-0 sm:hidden" />
    </Link>
  );
}
