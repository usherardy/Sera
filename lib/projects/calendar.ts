import { addDays } from "@/lib/dates";

/**
 * A Google Calendar "create event" link, pre-filled as an all-day event.
 * No Google sign-in or API access: the user reviews and saves it in Google.
 */
export function googleCalendarUrl({ title, date, details }: { title: string; date: string; details?: string }): string {
  const compact = (d: string) => d.replaceAll("-", "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${compact(date)}/${compact(addDays(date, 1))}`,
    details: details ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
