import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Sera · Logo concepts" };

/* Shared gradient (the same caramel → purple used for accent words). */
function Defs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <linearGradient id="sera-accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a86b3d" />
          <stop offset="50%" stopColor="#c8884f" />
          <stop offset="100%" stopColor="#5c4a99" />
        </linearGradient>
        <linearGradient id="sera-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2b27a" />
          <stop offset="100%" stopColor="#8a6bc7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ------------------------------------------------------------ the marks (48×48) */

/** 1. Thread: today's mark, refined. A single line, like a voice, running through the call. */
function Thread({ dark }: { dark?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="size-full">
      <rect width="48" height="48" rx="13" fill={dark ? "#2a2838" : "#e3e0ff"} />
      <path d="M9 26c4 0 4-10 8-10s4 16 8 16 4-11 7.5-11 3.5 5 6.5 5" fill="none" stroke={dark ? "#e3e0ff" : "#121214"} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 2. Evening: "sera" is Italian for evening. A sun settling on the horizon: the day wrapped up, nothing forgotten. */
function Evening({ dark }: { dark?: boolean }) {
  const ink = dark ? "#faf7f2" : "#121214";
  return (
    <svg viewBox="0 0 48 48" className="size-full">
      <rect width="48" height="48" rx="13" fill={dark ? "#2a2838" : "#fff3e6"} />
      <path d="M12 28a12 12 0 0 1 24 0Z" fill="url(#sera-sun)" />
      <path d="M9 28.5h30" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M15 33.5h18M20 38h8" stroke={ink} strokeWidth="2.6" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

/** 3. In scope: a voice wave held inside a frame. Every call, kept within what was agreed. */
function InScope({ dark }: { dark?: boolean }) {
  const ink = dark ? "#faf7f2" : "#121214";
  const bars: [number, number][] = [
    [15, 8],
    [19.5, 14],
    [24, 20],
    [28.5, 12],
    [33, 7],
  ];
  return (
    <svg viewBox="0 0 48 48" className="size-full">
      <rect x="4" y="4" width="40" height="40" rx="12" fill={dark ? "#2a2838" : "#ffffff"} stroke={ink} strokeWidth="2.6" />
      {bars.map(([x, h], i) => (
        <rect key={x} x={x - 1.6} y={24 - h / 2} width="3.2" height={h} rx="1.6" fill={i === 2 ? "url(#sera-accent)" : ink} />
      ))}
    </svg>
  );
}

/** 4. Quote: a speech bubble holding a quotation mark. Every finding comes with the exact words. */
function QuoteS({ dark }: { dark?: boolean }) {
  const ink = dark ? "#faf7f2" : "#121214";
  return (
    <svg viewBox="0 0 48 48" className="size-full">
      <rect width="48" height="48" rx="13" fill={dark ? "#2a2838" : "#ece6ff"} />
      <path
        d="M14 11.5h20a5 5 0 0 1 5 5v11.5a5 5 0 0 1-5 5h-8.5l-6.5 5.5v-5.5h-5a5 5 0 0 1-5-5v-11.5a5 5 0 0 1 5-5Z"
        fill={dark ? "#2a2838" : "#ffffff"}
        stroke={ink}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <text x="24.5" y="43" textAnchor="middle" fontFamily="var(--font-garamond), Georgia, serif" fontSize="40" fill="url(#sera-accent)">
        “
      </text>
    </svg>
  );
}

/** 5. Approved: a seal with a check. The change is agreed, in writing, before you build it. */
function Seal({ dark }: { dark?: boolean }) {
  const ink = dark ? "#faf7f2" : "#121214";
  return (
    <svg viewBox="0 0 48 48" className="size-full">
      <rect width="48" height="48" rx="13" fill={dark ? "#2a2838" : "#e9f8ef"} />
      <circle cx="24" cy="24" r="14" fill="none" stroke="url(#sera-accent)" strokeWidth="3" />
      <circle cx="24" cy="24" r="18.5" fill="none" stroke={ink} strokeWidth="1.4" strokeDasharray="1.6 3.2" opacity="0.5" />
      <path d="M17.5 24.5l4.3 4.3 8.7-9.3" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 6. Monogram: a single italic S, the same voice as the headings. Quiet and premium. */
function Monogram({ dark }: { dark?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="size-full">
      <rect x="1" y="1" width="46" height="46" rx="13" fill={dark ? "#2a2838" : "#faf7f2"} stroke={dark ? "#3a3850" : "rgba(20,30,80,0.12)"} strokeWidth="1.5" />
      <text x="24.5" y="35" textAnchor="middle" fontFamily="var(--font-garamond), Georgia, serif" fontStyle="italic" fontSize="34" fill="url(#sera-accent)">
        S
      </text>
    </svg>
  );
}

const CONCEPTS: { n: string; name: string; idea: string; Mark: (p: { dark?: boolean }) => ReactNode }[] = [
  { n: "01", name: "Thread", idea: "A single line, like a voice, running through every call. Today's logo, refined.", Mark: Thread },
  { n: "02", name: "Evening", idea: "“Sera” means evening in Italian: a sun settling on the horizon. Your day wrapped up, nothing forgotten.", Mark: Evening },
  { n: "03", name: "In scope", idea: "A voice wave held inside a frame: every call kept within what was agreed.", Mark: InScope },
  { n: "04", name: "Quote", idea: "A speech bubble holding a quotation mark: every finding comes with the exact words that were said.", Mark: QuoteS },
  { n: "05", name: "Approved", idea: "A seal with a check: changes agreed in writing before you build them.", Mark: Seal },
  { n: "06", name: "Monogram", idea: "One italic S in the same serif as the headings. Quiet, premium, timeless.", Mark: Monogram },
];

function Wordmark({ Mark, dark, size = "lg" }: { Mark: (p: { dark?: boolean }) => ReactNode; dark?: boolean; size?: "lg" | "sm" }) {
  const big = size === "lg";
  return (
    <span className={big ? "inline-flex items-center gap-3.5" : "inline-flex items-center gap-2.5"}>
      <span className={big ? "size-14" : "size-8"}>
        <Mark dark={dark} />
      </span>
      <span className={`font-serif leading-none tracking-[0.01em] ${big ? "text-[2.6rem]" : "text-[1.55rem]"} ${dark ? "text-cream" : "text-ink"}`}>Sera</span>
    </span>
  );
}

export default function BrandPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-10 px-6 py-14">
      <Defs />
      <header className="flex flex-col gap-3">
        <p className="eyebrow">Brand · pick one</p>
        <h1 className="display text-[2.8rem] sm:text-6xl">
          Logo <em>concepts</em>
        </h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          Six directions for Sera. Each is shown large, in the nav, on a dark background, and at browser-tab size. Tell me the number you like
          (or mix them, like “02 in the colors of 04”).
        </p>
      </header>

      <ul className="grid gap-5 md:grid-cols-2">
        {CONCEPTS.map(({ n, name, idea, Mark }) => (
          <li key={n} className="surface flex flex-col gap-6 p-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="display text-3xl">
                <span className="mr-3 font-mono text-sm tracking-normal text-ink-muted">{n}</span>
                {name}
              </p>
            </div>
            <div className="flex min-h-36 items-center justify-center rounded-2xl bg-cream/70">
              <Wordmark Mark={Mark} />
            </div>
            <div className="grid grid-cols-[1fr_1fr_auto] items-stretch gap-3">
              <div className="flex items-center rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 shadow-[0_6px_18px_-12px_rgba(20,30,80,0.3)]">
                <Wordmark Mark={Mark} size="sm" />
              </div>
              <div className="flex items-center rounded-xl bg-fathom px-3 py-2.5">
                <Wordmark Mark={Mark} size="sm" dark />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-cream-dark bg-paper px-3">
                <span className="size-4">
                  <Mark />
                </span>
                <span className="size-6">
                  <Mark />
                </span>
              </div>
            </div>
            <p className="text-sm text-ink-muted">{idea}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
