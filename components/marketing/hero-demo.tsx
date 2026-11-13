"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Send, Volume2, VolumeX } from "lucide-react";
import { Waveform } from "@/components/capture/waveform";
import { cn } from "@/lib/utils";

/*
 * Landing hero: a call being recorded (left) and Sera sorting each line
 * (right). A picker wheel, like a phone's alarm-time picker, spins through
 * the options and lands on the right one, with a soft tick per row when sound
 * is on. Illustration only, labeled with a sample client.
 */

const OPTIONS = ["In scope", "Out of scope", "Changed", "Unclear", "Your task", "Idea"] as const;
const SLOTS = OPTIONS.length * 2; // the options twice around a full circle
const STEP = 360 / SLOTS; // degrees per row
const ROW = 34; // px
const RADIUS = ROW / 2 / Math.tan(((STEP / 2) * Math.PI) / 180);

const BAND: Record<number, string> = {
  0: "bg-success/45",
  1: "bg-error-bg",
  4: "bg-dawn",
};
const LABEL: Record<number, string> = {
  0: "text-success-dark",
  1: "text-pulse",
  4: "text-ink",
};

type Line = {
  who: "Client" | "You";
  text: string;
  option: number;
  title: string;
  detail: ReactNode;
  action?: ReactNode;
  hold: number;
};

const LINES: Line[] = [
  {
    who: "Client",
    text: "The contact page looks great.",
    option: 0,
    title: "Contact page",
    detail: "Already in your agreement. Nothing to flag.",
    hold: 2600,
  },
  {
    who: "Client",
    text: "Can we also add Stripe payments to the website?",
    option: 1,
    title: "Stripe payment integration",
    detail: (
      <>
        Agreement: <span className="font-semibold text-ink">Payment integration</span> is listed as not included.
      </>
    ),
    action: (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white">
        <Send className="size-3.5" /> Ask client to approve
      </span>
    ),
    hold: 4600,
  },
  {
    who: "You",
    text: "I can look into it, but I'll need to estimate it first.",
    option: 4,
    title: "Estimate the Stripe work",
    detail: "A promise you made, added to your to-do list.",
    action: (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-success-dark">
        <Check className="size-3.5" /> Added to To do
      </span>
    ),
    hold: 3200,
  },
];

/* ------------------------------------------------------------ sound */

// A short filtered noise burst: a soft mechanical tick, generated in the
// browser (no audio file). Sound is ON by default, but browsers only allow
// audio after the visitor interacts, so it unlocks on the first click, tap or
// key press anywhere on the page.
let audio: AudioContext | null = null;
let noise: AudioBuffer | null = null;

/** Resolves true once audio is actually playing (it needs a user gesture). */
async function startAudio(): Promise<boolean> {
  if (typeof window === "undefined" || !window.AudioContext) return false;
  if (!audio) {
    audio = new AudioContext();
    const len = Math.floor(audio.sampleRate * 0.025);
    noise = audio.createBuffer(1, len, audio.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 8);
  }
  await audio.resume().catch(() => {});
  return audio.state === "running";
}

function tick(volume: number) {
  if (!audio || !noise || audio.state !== "running") return;
  const src = audio.createBufferSource();
  src.buffer = noise;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2600;
  filter.Q.value = 1.4;
  const gain = audio.createGain();
  gain.gain.value = volume;
  src.connect(filter).connect(gain).connect(audio.destination);
  src.start();
}

/* ------------------------------------------------------------ parts */

function Timer() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setS((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-[0.8125rem] text-white/70 tabular-nums">
      {String(Math.floor(s / 60)).padStart(2, "0")}:{String(s % 60).padStart(2, "0")}
    </span>
  );
}

function Wheel({ ringRef, center, landed, option }: { ringRef: React.RefObject<HTMLDivElement | null>; center: number; landed: boolean; option: number }) {
  return (
    <div
      className="relative h-34 w-full overflow-hidden select-none mask-[linear-gradient(transparent,black_32%,black_68%,transparent)] perspective-[520px]"
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-x-1 top-1/2 h-8.5 -translate-y-1/2 rounded-lg bg-ink/6 transition-colors duration-300",
          landed && BAND[option],
        )}
      />
      <div ref={ringRef} className="absolute inset-x-0 top-1/2 -mt-[17px] h-8.5 transform-3d">
        {Array.from({ length: SLOTS }, (_, k) => {
          const o = k % OPTIONS.length;
          const isCenter = k === center;
          return (
            <div
              key={k}
              className={cn(
                "absolute inset-0 flex items-center justify-center text-[0.95rem] backface-hidden",
                isCenter ? cn("font-semibold", landed ? (LABEL[o] ?? "text-ink") : "text-ink") : "text-ink/55",
              )}
              style={{ transform: `rotateX(${-k * STEP}deg) translateZ(${RADIUS}px)` }}
            >
              {OPTIONS[o]}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ demo */

export function HeroDemo() {
  const [line, setLine] = useState(0);
  const [landed, setLanded] = useState(false);
  const [center, setCenter] = useState(0);
  const [sound, setSound] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef(0);
  const soundOn = useRef(true);

  // Sound is on by default: unlock audio on the visitor's first interaction.
  useEffect(() => {
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    const unlock = (e: Event) => {
      // The toggle handles its own clicks (so a first click there doesn't turn sound off).
      if (!soundOn.current || (e.target instanceof Element && e.target.closest("[data-sound-toggle]"))) return;
      void startAudio().then((ok) => {
        if (!ok) return;
        setUnlocked(true);
        events.forEach((e) => window.removeEventListener(e, unlock));
      });
    };
    events.forEach((e) => window.addEventListener(e, unlock, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, unlock));
  }, []);

  // Only run while on screen: no ticking while the visitor reads further down.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const current = LINES[line];
    const from = pos.current;
    let to = Math.round(from) + (reduce ? 0 : 7); // spin at least seven rows
    to += (((current.option - to) % OPTIONS.length) + OPTIONS.length) % OPTIONS.length;

    const paint = (p: number) => {
      if (ringRef.current) ringRef.current.style.transform = `rotateX(${p * STEP}deg)`;
    };
    const wrap = (k: number) => ((k % SLOTS) + SLOTS) % SLOTS;
    let raf = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const finish = () => {
      pos.current = wrap(to);
      paint(pos.current);
      setCenter(pos.current);
      setLanded(true);
      timers.push(
        setTimeout(() => {
          setLanded(false);
          setLine((l) => (l + 1) % LINES.length);
        }, current.hold),
      );
    };

    // Let the line be "said" first, then spin.
    timers.push(
      setTimeout(() => {
        setLanded(false);
        if (reduce) return finish();
        const start = performance.now();
        const duration = 1300 + (to - from) * 45;
        let last = Math.round(from);
        const frame = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 4);
          const p = from + (to - from) * eased;
          paint(p);
          const r = Math.round(p);
          if (r !== last) {
            last = r;
            setCenter(wrap(r));
            if (soundOn.current) tick(0.55);
          }
          if (t < 1) raf = requestAnimationFrame(frame);
          else finish();
        };
        raf = requestAnimationFrame(frame);
      }, 1100),
    );

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [line, visible]);

  const toggleSound = () => {
    // On but still locked by the browser: this click unlocks it and keeps it on.
    if (sound && !unlocked) {
      void startAudio().then(setUnlocked);
      return;
    }
    const next = !sound;
    soundOn.current = next;
    setSound(next);
    if (next) void startAudio().then(setUnlocked);
  };

  const current = LINES[line];
  const words = current.text.split(" ");

  return (
    <div ref={rootRef} className="grid w-full grid-cols-1 items-center gap-8 text-left md:grid-cols-[0.9fr_1.1fr] md:gap-12">
      {/* the call, being recorded */}
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex w-full items-center gap-3 rounded-full bg-[linear-gradient(180deg,#2e2e33_0%,#121214_100%)] py-3 pr-5 pl-4 text-white shadow-[0_0_0_8px_rgba(255,255,255,0.35),0_18px_40px_-16px_rgba(20,30,80,0.6)]">
          <span className="relative flex size-2.5 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-flare opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-flare" />
          </span>
          <Waveform className="h-5 shrink-0" />
          <span className="min-w-0 flex-1 truncate font-mono text-[0.8125rem]">
            Recording<span className="hidden sm:inline"> · Acme Studio</span>
          </span>
          <Timer />
        </div>
        <div className="flex min-h-32 flex-col gap-2 px-1 sm:min-h-38" aria-live="polite">
          <p className="eyebrow">{current.who === "You" ? "You" : "Client"}</p>
          <p key={line} className="font-serif text-[1.9rem] leading-[1.15] sm:text-[2.35rem]">
            “
            {words.map((w, i) => (
              <span
                key={i}
                className="animate-in fade-in slide-in-from-bottom-1 duration-300"
                style={{ animationDelay: `${i * 70}ms`, animationFillMode: "both" }}
              >
                {w}
                {i < words.length - 1 ? " " : ""}
              </span>
            ))}
            ”
          </p>
        </div>
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={sound}
          data-sound-toggle
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/80 bg-white/60 px-3 py-1.5 text-xs font-semibold text-ink/70 backdrop-blur transition-colors hover:text-ink"
        >
          {sound ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
          {sound ? (unlocked ? "Sound on" : "Sound on · tap to hear") : "Sound off"}
        </button>
      </div>

      {/* what Sera does with it */}
      <div className="surface-raised flex min-w-0 flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow">Check-in call · Acme Studio</span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold transition-colors",
              landed ? "bg-success/40 text-success-dark" : "bg-warning text-warning-dark",
            )}
          >
            {landed ? "Checked" : "Checking…"}
          </span>
        </div>
        <ol className="flex flex-col gap-1 rounded-xl bg-cream/60 p-2">
          {LINES.map((l, i) => (
            <li
              key={l.text}
              className={cn(
                "rounded-lg px-3 py-2 text-[0.875rem] transition-all duration-500",
                i === line && "bg-dawn ring-1 ring-purple/25",
                i > line && "opacity-35",
              )}
            >
              <span className="mr-2 font-mono text-[0.65rem] tracking-wide text-ink-muted uppercase">{l.who}</span>
              {l.text}
            </li>
          ))}
        </ol>
        <div className="grid items-center gap-3 rounded-xl border border-cream-dark p-3 sm:grid-cols-[10.5rem_1fr] sm:gap-4">
          <Wheel ringRef={ringRef} center={center} landed={landed} option={current.option} />
          <div className="flex min-h-30 flex-col justify-center gap-2 px-1 sm:px-0">
            {landed ? (
              <div key={line} className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                <p className="font-semibold">{current.title}</p>
                <p className="text-sm text-ink-muted">{current.detail}</p>
                {current.action && <div className="mt-1">{current.action}</div>}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">Checking against your agreement…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
