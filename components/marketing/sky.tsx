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

// Each cloud is a cluster of circles in a 200×100 box; the filter turns them into fluff.
const PUFFS: [number, number, number][] = [
  [40, 68, 26],
  [70, 52, 34],
  [104, 44, 40],
  [140, 54, 32],
  [166, 66, 24],
  [92, 72, 30],
  [124, 74, 28],
  [58, 78, 20],
  [150, 80, 18],
];

function Cloud({ x, y, w, opacity = 1, flip = false, drift = "a" }: CloudSpec) {
  return (
    <svg
      viewBox="0 0 200 110"
      className={cn("absolute h-auto", drift === "a" ? "motion-safe:animate-[sky-drift-a_46s_ease-in-out_infinite_alternate]" : "motion-safe:animate-[sky-drift-b_58s_ease-in-out_infinite_alternate]")}
      style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, opacity, transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden
    >
      {/* shadow layer: a cooler tint underneath for depth */}
      <g filter="url(#sky-fluff)" fill="#cfe2f3" transform="translate(4 8)">
        {PUFFS.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </g>
      <g filter="url(#sky-fluff)" fill="#ffffff">
        {PUFFS.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy - 2} r={r * 0.96} />
        ))}
      </g>
    </svg>
  );
}

const CLOUDS: CloudSpec[] = [
  { x: 74, y: -6, w: 34, opacity: 0.95, drift: "a" },
  { x: 86, y: 30, w: 22, opacity: 0.85, flip: true, drift: "b" },
  { x: -10, y: 12, w: 30, opacity: 0.9, flip: true, drift: "b" },
  { x: -8, y: 58, w: 26, opacity: 0.8, drift: "a" },
  { x: 80, y: 66, w: 28, opacity: 0.85, drift: "b" },
  { x: 30, y: -12, w: 18, opacity: 0.55, drift: "a" },
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
      {/* shared filter definition */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="sky-fluff" x="-40%" y="-60%" width="180%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feGaussianBlur in="rough" stdDeviation="2.2" />
        </filter>
      </svg>
      <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_62%,transparent_100%)]">
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
