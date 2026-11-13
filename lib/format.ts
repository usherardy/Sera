// Display formatting. All wall-clock output takes an explicit IANA timezone so
// server and client render identically and recordings keep their local times.

export const DEFAULT_TZ = "Europe/Vilnius";

export function formatClock(iso: string, tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).format(new Date(iso));
}

/** Wall-clock time of an offset inside a recording, e.g. 10:24 AM + 26.5 s */
export function formatMomentClock(
  recordedAt: string,
  offsetMs: number | null,
  tz: string = DEFAULT_TZ,
): string | null {
  if (offsetMs == null) return null;
  return formatClock(
    new Date(new Date(recordedAt).getTime() + offsetMs).toISOString(),
    tz,
  );
}

/** 82 -> "1:22" */
export function formatDuration(seconds: number | null): string {
  if (seconds == null) return "--:--";
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(r).padStart(2, "0")}`;
}

/** Offset inside a recording: 64000 -> "01:04" */
export function formatOffset(ms: number | null): string {
  if (ms == null) return "--:--";
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** "2026-11-20" -> "Fri, Nov 20" (date-only values are timezone-free) */
export function formatDateOnly(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "2026-11-14" -> "Saturday · 14 Nov 2026" */
export function formatDayHeading(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(dt);
  const rest = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(dt);
  return `${weekday} · ${rest}`;
}

/** Local calendar date (YYYY-MM-DD) of an instant in a timezone */
export function localDateOf(iso: string, tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: tz,
  }).format(new Date(iso));
}

export function formatOwner(owner: string | null): string {
  if (!owner) return "Unassigned";
  if (owner.toLowerCase() === "me") return "Me";
  return owner;
}

export function greetingFor(hour: number): string {
  if (hour < 5) return "Good evening.";
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}
