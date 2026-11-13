import { CalendarDays, Database, Globe, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/layout-bits";
import { SampleBadge } from "@/components/common/badges";

function SettingRow({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: ReactNode;
  body: string;
  action: ReactNode;
}) {
  return (
    <div className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-dawn [&_svg]:size-5">{icon}</span>
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-ink-muted">{body}</p>
      </div>
      {action}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Settings"
        title={
          <>
            Your <em>settings</em>
          </>
        }
      />
      <div className="flex flex-col gap-3">
        <SettingRow
          icon={<CalendarDays />}
          title="Google Calendar"
          body="Add approved tasks to your calendar. Nothing is created without your confirmation."
          action={<Button variant="outline">Connect</Button>}
        />
        <SettingRow
          icon={<Globe />}
          title="Timezone"
          body="Used to place recordings on the right day and resolve deadlines like “by Friday”. Currently Europe/Vilnius."
          action={<Button variant="ghost">Use this device&apos;s</Button>}
        />
        <SettingRow
          icon={<Database />}
          title={
            <span className="inline-flex items-center gap-2">
              Sample day <SampleBadge />
            </span>
          }
          body="Load three labeled sample recordings to explore FollowThrough. They are never mixed up with your own."
          action={
            <div className="flex gap-2">
              <Button variant="outline">Load</Button>
              <Button variant="ghost">Remove</Button>
            </div>
          }
        />
        <SettingRow icon={<LogOut />} title="Sign out" body="You'll need to sign in again to see your memories." action={<Button variant="ghost">Sign out</Button>} />
      </div>
    </div>
  );
}
