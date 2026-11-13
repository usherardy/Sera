import { CalendarPlus } from "lucide-react";
import { googleCalendarUrl } from "@/lib/projects/calendar";
import { cn } from "@/lib/utils";

/** Opens Google Calendar with an all-day event pre-filled. Only shown when there's a real date. */
export function CalendarLink({ title, date, details, className }: { title: string; date: string | null; details?: string; className?: string }) {
  if (!date) return null;
  return (
    <a
      href={googleCalendarUrl({ title, date, details })}
      target="_blank"
      rel="noopener noreferrer"
      title="Add to Google Calendar"
      className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold text-ink/70 hover:bg-ink/5 hover:text-ink", className)}
    >
      <CalendarPlus className="size-3.5" />
      <span>Add to calendar</span>
    </a>
  );
}
