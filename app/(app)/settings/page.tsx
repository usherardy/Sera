import { CalendarDays, Database, Globe, LogOut } from "lucide-react";
import { Suspense, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/layout-bits";
import { SampleBadge } from "@/components/common/badges";
import { SampleDayButtons, SignOutButton, TimezoneButton } from "@/components/settings/settings-actions";
import { getViewer } from "@/lib/data";

function SettingRow({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: ReactNode;
  body: ReactNode;
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
      <Suspense fallback={<Skeleton className="h-96 rounded-card bg-cream-dark/60" />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

async function SettingsContent() {
  const viewer = await getViewer();
  return (
    <div className="flex flex-col gap-3">
      <SettingRow
        icon={<CalendarDays />}
        title="Google Calendar"
        body="Add approved tasks and check-ins to your calendar. Nothing is created without your confirmation. Coming next."
        action={
          <Button variant="outline" disabled>
            Connect
          </Button>
        }
      />
      <SettingRow
        icon={<Globe />}
        title="Timezone"
        body={
          <>
            Places recordings on the right day and resolves deadlines like “by Friday”. Currently{" "}
            <span className="font-mono text-ink">{viewer.timezone}</span>.
          </>
        }
        action={<TimezoneButton current={viewer.timezone} />}
      />
      <SettingRow
        icon={<Database />}
        title={
          <span className="inline-flex items-center gap-2">
            Sample day <SampleBadge />
          </span>
        }
        body="Load three labeled sample recordings into today to explore SERA, or remove them. They're never mixed up with your own."
        action={<SampleDayButtons />}
      />
      <SettingRow
        icon={<LogOut />}
        title="Sign out"
        body="You'll need to sign in again to see your memories."
        action={<SignOutButton />}
      />
    </div>
  );
}
