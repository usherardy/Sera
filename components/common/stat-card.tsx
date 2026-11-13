import type { ReactNode } from "react";

export function StatCard({ value, label, icon }: { value: number; label: string; icon: ReactNode }) {
  return (
    <div className="surface flex flex-col gap-3 p-4 sm:p-5">
      <span className="flex size-8 items-center justify-center rounded-full bg-dawn text-ink [&_svg]:size-4">{icon}</span>
      <div>
        <p className="text-4xl font-semibold leading-none tracking-tight sm:text-[2.75rem]">{value}</p>
        <p className="mt-1.5 text-xs font-semibold text-ink-muted sm:text-sm">{label}</p>
      </div>
    </div>
  );
}
