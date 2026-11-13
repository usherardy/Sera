import { CheckCircle2, Info } from "lucide-react";
import { SampleBadge } from "@/components/common/badges";
import type { DailySummary } from "@/lib/types";

/** The day's summary on an inverted teal panel. */
export function DailyMemoryCard({ summary, sample }: { summary: DailySummary; sample?: boolean }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-fathom p-6 text-cream sm:rounded-[2rem] sm:p-9">
      {/* soft decorative glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-dawn/15 blur-3xl" />
      <div className="relative flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-xs tracking-[0.08em] text-cream/70 uppercase">Daily memory</p>
          {sample && <SampleBadge />}
        </div>
        <p className="font-serif text-[1.6rem] leading-[1.2] sm:text-[2rem]">{summary.summary}</p>

        {summary.key_topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {summary.key_topics.map((t) => (
              <span key={t} className="rounded-full border border-cream/25 px-3 py-1 text-sm font-medium text-cream/90">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="grid gap-6 border-t border-cream/15 pt-6 sm:grid-cols-2">
          {summary.key_decisions.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="font-mono text-xs tracking-[0.08em] text-cream/70 uppercase">Decisions</p>
              <ul className="flex flex-col gap-2">
                {summary.key_decisions.map((d) => (
                  <li key={d} className="flex gap-2.5 text-[0.9375rem]">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-dawn" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {summary.notable_info.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="font-mono text-xs tracking-[0.08em] text-cream/70 uppercase">Worth remembering</p>
              <ul className="flex flex-col gap-2">
                {summary.notable_info.map((d) => (
                  <li key={d} className="flex gap-2.5 text-[0.9375rem]">
                    <Info className="mt-0.5 size-4 shrink-0 text-glow" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
