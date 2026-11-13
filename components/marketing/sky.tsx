import { cn } from "@/lib/utils";

/**
 * An original painted-sky backdrop: a soft blue gradient with fluffy SVG
 * clouds (blobs roughened by turbulence, then blurred), a light film grain,
 * and a fade into the page colour at the bottom. Clouds drift slowly unless
 * the viewer prefers reduced motion.
 */

type CloudSpec = {
  /** position + size in % of the sky box */
  x: number;
  y: number;
  w: number;
  opacity?: number;
  flip?: boolean;
  drift?: "a" | "b";
};

// Each cloud is a cluster of circles drawn at full resolution (800×440 box) so
// edges stay crisp when scaled; the filter only roughens the outline slightly.
const PUFFS: [number, number, number][] = [
  [160, 272, 104],
  [280, 208, 136],
  [416, 176, 160],
  [560, 216, 128],
  [664, 264, 96],
  [368, 288, 120],
  [496, 296, 112],
  [232, 312, 80],
  [600, 320, 72],
];

function Cloud({ x, y, w, opacity = 1, flip = false, drift = "a", seed = 1 }: CloudSpec & { seed?: 1 | 2 | 3 }) {
  return (
    <svg
      viewBox="0 0 800 440"
      overflow="visible"
      className={cn(
        "absolute h-auto overflow-visible",
        drift === "a" ? "motion-safe:animate-[sky-drift-a_46s_ease-in-out_infinite_alternate]" : "motion-safe:animate-[sky-drift-b_58s_ease-in-out_infinite_alternate]",
      )}
      style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, opacity, transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden
    >
      {/* soft cool shadow underneath for depth */}
      <g filter="url(#sky-shadow)" fill="#b9d3ea" opacity="0.4" transform="translate(18 34)">
        {PUFFS.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </g>
      {/* the cloud: crisp, lightly roughened outline, white with a faint cool base */}
      <g filter={`url(#sky-fluff-${seed})`} fill="url(#sky-cloud-fill)">
        {PUFFS.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    </svg>
  );
}

const CLOUDS: (CloudSpec & { seed: 1 | 2 | 3 })[] = [
  { x: 72, y: -4, w: 32, drift: "a", seed: 1 },
  { x: 86, y: 34, w: 20, opacity: 0.95, flip: true, drift: "b", seed: 2 },
  { x: -9, y: 10, w: 28, flip: true, drift: "b", seed: 3 },
  { x: -7, y: 58, w: 24, opacity: 0.95, drift: "a", seed: 2 },
  { x: 79, y: 66, w: 26, opacity: 0.95, drift: "b", seed: 3 },
  { x: 30, y: -10, w: 16, opacity: 0.7, drift: "a", seed: 1 },
];

export function Sky({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      {/* sky gradient, fading into the page colour */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(900px 500px at 50% 0%, rgba(255,255,255,0.55), rgba(255,255,255,0) 70%), linear-gradient(180deg, #9ccbf0 0%, #bcdcf6 36%, #d6eaf8 62%, rgba(226,238,246,0.7) 80%, rgba(250,247,242,0) 100%)",
        }}
      />
      {/* shared definitions: three outline textures, a soft shadow, and the cloud fill */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          {[1, 2, 3].map((seed) => (
            <filter key={seed} id={`sky-fluff-${seed}`} x="-15%" y="-25%" width="130%" height="150%">
              <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="3" seed={seed * 7} result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="26" xChannelSelector="R" yChannelSelector="G" result="rough" />
              <feGaussianBlur in="rough" stdDeviation="1.4" />
            </filter>
          ))}
          <filter id="sky-shadow" x="-20%" y="-30%" width="140%" height="160%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <linearGradient id="sky-cloud-fill" gradientUnits="userSpaceOnUse" x1="0" y1="120" x2="0" y2="420">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="62%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e4eef8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70 [mask-image:linear-gradient(to_bottom,black_62%,transparent_100%)]">
        {CLOUDS.map((c, i) => (
          <Cloud key={i} {...c} />
        ))}
      </div>
      {/* film grain over the sky */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.09] mix-blend-overlay [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23g)'/></svg>\")",
        }}
      />
      {children}
    </div>
  );
}
