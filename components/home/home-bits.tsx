"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Mic, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCapture } from "@/components/capture/capture-provider";
import { greetingFor } from "@/lib/format";

/** Time-of-day greeting computed in the viewer's browser (avoids server clock/timezone drift). */
export function Greeting({ tz }: { tz: string }) {
  const hour = useSyncExternalStore(
    () => () => {},
    () =>
      Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(new Date())),
    () => -1,
  );
  return <>{hour < 0 ? "Hello." : greetingFor(hour)}</>;
}

export function CaptureCta() {
  const { openSheet, state } = useCapture();
  return (
    <div className="flex gap-2">
      <Button variant="ink" size="lg" onClick={openSheet} disabled={state.phase === "recording"}>
        <Mic />
        Record
      </Button>
      <Button variant="outline" size="lg" onClick={openSheet} disabled={state.phase === "recording"}>
        <Upload />
        Upload
      </Button>
    </div>
  );
}

export function StatCard({ value, label, icon }: { value: number; label: string; icon: ReactNode }) {
  return (
    <div className="surface flex flex-col gap-3 p-4 sm:p-5">
      <span className="flex size-8 items-center justify-center rounded-full bg-dawn text-ink [&_svg]:size-4">{icon}</span>
      <div>
        <p className="font-serif text-4xl leading-none sm:text-5xl">{value}</p>
        <p className="mt-1.5 text-xs font-semibold text-ink-muted sm:text-sm">{label}</p>
      </div>
    </div>
  );
}
