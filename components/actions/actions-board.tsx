"use client";

import { useState } from "react";
import { CheckSquare, Hourglass, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/layout-bits";
import { splitLedger } from "@/lib/ledger";
import { cn } from "@/lib/utils";
import { CommitmentCard, type C } from "./commitment-card";
import { useCommitments } from "./use-commitments";

type Bucket = "review" | "upcoming" | "completed";

function bucketOf(c: C): Bucket | null {
  if (c.approval_status === "dismissed") return null;
  if (c.approval_status === "pending") return "review";
  return c.completion_status === "done" ? "completed" : "upcoming";
}

/** Commitment review UI, organised as a promise ledger: yours vs. waiting on others. */
export function ActionsBoard({
  commitments: initial,
  tz,
  mode = "full",
  limit,
}: {
  commitments: C[];
  tz: string;
  mode?: "full" | "preview";
  limit?: number;
}) {
  const store = useCommitments(initial);
  const [tab, setTab] = useState<Bucket>("review");

  const cardFor = (c: C, compact = false) => (
    <CommitmentCard
      key={c.id}
      commitment={c}
      tz={tz}
      compact={compact}
      onApprove={() => store.approve(c)}
      onDismiss={() => store.dismiss(c)}
      onEdit={() => store.edit(c)}
      onToggleComplete={() => store.toggleComplete(c)}
      onSync={() => store.openSync(c)}
    />
  );

  const by = (b: Bucket) => store.items.filter((c) => bucketOf(c) === b);

  if (mode === "preview") {
    const open = [...by("review"), ...by("upcoming")].slice(0, limit ?? 3);
    return (
      <>
        {open.length === 0 ? (
          <EmptyState icon={<CheckSquare />} title="No commitments found in your recordings." />
        ) : (
          <div className="flex flex-col gap-3">{open.map((c) => cardFor(c, true))}</div>
        )}
        {store.dialogs}
      </>
    );
  }

  const tabs: { value: Bucket; label: string; empty: string }[] = [
    { value: "review", label: "Needs review", empty: "Nothing to review. New commitments from your recordings land here." },
    { value: "upcoming", label: "Upcoming", empty: "Approved tasks you haven't finished will show here." },
    { value: "completed", label: "Completed", empty: "Tasks you mark complete will show here." },
  ];

  return (
    <>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Bucket)} className="gap-5">
        <TabsList className="h-auto w-full gap-1 rounded-xl border-2 border-cream-dark bg-paper p-1 sm:w-fit">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className={cn(
                "h-10 flex-1 rounded-lg px-3 text-sm font-semibold sm:flex-none sm:px-4",
                "data-active:bg-dawn data-active:text-ink data-active:shadow-none",
              )}
            >
              {t.label}
              <span className="font-mono text-xs text-ink-muted">{by(t.value).length}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => {
          const all = by(t.value);
          const { yours, waitingOn } = splitLedger(all);
          return (
            <TabsContent key={t.value} value={t.value}>
              {all.length === 0 ? (
                <EmptyState icon={<CheckSquare />} title={t.value === "review" ? "All caught up." : "Nothing here yet."} body={t.empty} />
              ) : (
                <div className="flex flex-col gap-8">
                  {yours.length > 0 && (
                    <LedgerGroup icon={<UserRound />} title="You promised" count={yours.length}>
                      {yours.map((c) => cardFor(c))}
                    </LedgerGroup>
                  )}
                  {waitingOn.length > 0 && (
                    <LedgerGroup
                      icon={<Hourglass />}
                      title="Waiting on others"
                      count={waitingOn.length}
                      note="Promises other people made to you. SERA can remind you to check in when they're due."
                    >
                      {waitingOn.map((c) => cardFor(c))}
                    </LedgerGroup>
                  )}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
      {store.dialogs}
    </>
  );
}

function LedgerGroup({
  icon,
  title,
  count,
  note,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold [&_svg]:size-4">
          {icon}
          {title}
          <span className="font-mono text-xs font-normal text-ink-muted">{count}</span>
        </h2>
        {note && <p className="text-sm text-ink-muted">{note}</p>}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
