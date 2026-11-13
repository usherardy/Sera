"use client";

import { useEffect, useRef, type RefObject } from "react";
import { cn } from "@/lib/utils";

const BARS = 18;

/** Live mic waveform driven by an AnalyserNode; falls back to a gentle CSS wave. */
export function Waveform({
  analyserRef,
  className,
  barClassName = "bg-dawn",
}: {
  analyserRef?: RefObject<AnalyserNode | null>;
  className?: string;
  barClassName?: string;
}) {
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    const data = new Uint8Array(32);
    const tick = () => {
      const analyser = analyserRef?.current;
      if (analyser) {
        analyser.getByteFrequencyData(data);
        barsRef.current.forEach((el, i) => {
          if (!el) return;
          // mirror around the centre so the wave looks symmetric
          const mid = (BARS - 1) / 2;
          const bin = Math.min(data.length - 1, Math.round(Math.abs(i - mid)) + 1);
          const v = data[bin] / 255;
          el.style.transform = `scaleY(${Math.max(0.12, Math.min(1, v * 1.4))})`;
          el.style.animation = "none";
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [analyserRef]);

  return (
    <span className={cn("flex h-6 items-center gap-[3px]", className)} aria-hidden>
      {Array.from({ length: BARS }).map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            barsRef.current[i] = el;
          }}
          className={cn("h-full w-[3px] origin-center rounded-full animate-wave", barClassName)}
          style={{ animationDelay: `${(i % 6) * 0.12}s`, transform: "scaleY(0.3)" }}
        />
      ))}
    </span>
  );
}
