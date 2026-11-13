"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EyeOff, PlayCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { CategoryBadge, ConfidenceMeter, SampleBadge } from "@/components/common/badges";
import { PlayClip } from "@/components/common/play-clip";
import { EmptyState, EvidenceQuote } from "@/components/common/layout-bits";
import { useMediaQuery } from "@/hooks/use-media-query";
import { api } from "@/lib/client/api";
import { DESIGN_PREVIEW } from "@/lib/preview";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/categories";
import { formatMomentClock, formatOffset } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Moment, MomentCategory, WithSource } from "@/lib/types";
import { MomentCard } from "./moment-card";

type M = Moment & WithSource;
type Filter = "all" | MomentCategory;

export function MomentList({
  moments: initial,
  tz,
  variant = "stack",
  showFilters = false,
  compact = false,
  emptyTitle = "Important moments will appear after processing.",
}: {
  moments: M[];
  tz: string;
  variant?: "stack" | "timeline";
  showFilters?: boolean;
  compact?: boolean;
  emptyTitle?: string;
}) {
  const [moments, setMoments] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const visible = useMemo(
    () => moments.filter((m) => !m.dismissed && (filter === "all" || m.category === filter)),
    [moments, filter],
  );
  const open = moments.find((m) => m.id === openId) ?? null;

  const setDismissed = (id: string, dismissed: boolean) => {
    setMoments((ms) => ms.map((m) => (m.id === id ? { ...m, dismissed } : m)));
    if (DESIGN_PREVIEW) return;
    api(`/api/moments/${id}`, "PATCH", { dismissed }).catch(() => {
      setMoments((ms) => ms.map((m) => (m.id === id ? { ...m, dismissed: !dismissed } : m)));
      toast.error("Couldn't save. Try again.");
    });
  };

  const dismiss = (id: string) => {
    setDismissed(id, true);
    setOpenId(null);
    toast("Moment dismissed", { action: { label: "Undo", onClick: () => setDismissed(id, false) } });
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0 };
    for (const m of moments) {
      if (m.dismissed) continue;
      c.all++;
      c[m.category] = (c[m.category] ?? 0) + 1;
    }
    return c;
  }, [moments]);

  return (
    <div className="flex flex-col gap-5">
      {showFilters && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
          {(["all", ...CATEGORY_ORDER] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors",
                filter === f ? "border-ink bg-dawn" : "border-cream-dark bg-paper text-ink/70 hover:text-ink",
              )}
            >
              {f !== "all" && <span className={cn("size-2 rounded-full", CATEGORY_META[f].dot)} />}
              {f === "all" ? "All" : CATEGORY_META[f].plural}
              <span className="font-mono text-xs text-ink-muted">{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState icon={<Sparkles />} title={emptyTitle} />
      ) : variant === "timeline" ? (
        <ol className="relative flex flex-col gap-4 before:absolute before:top-2 before:bottom-2 before:left-[0.6875rem] before:w-0.5 before:bg-cream-dark sm:before:left-[4.6875rem]">
          {visible.map((m) => (
            <li key={m.id} className="relative flex gap-4 sm:gap-6">
              <div className="flex w-6 shrink-0 flex-col items-center pt-5 sm:w-[5.25rem] sm:flex-row sm:items-start sm:justify-end sm:gap-3">
                <span className="hidden pt-0.5 font-mono text-xs text-ink-muted sm:block">
                  {formatMomentClock(m.recording.recorded_at, m.start_ms, tz) ?? "--"}
                </span>
                <span
                  className={cn(
                    "relative z-10 size-3.5 rounded-full border-2 border-cream ring-2 ring-cream-dark",
                    CATEGORY_META[m.category].dot,
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <MomentCard moment={m} tz={tz} compact={compact} onOpen={() => setOpenId(m.id)} />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((m) => (
            <MomentCard key={m.id} moment={m} tz={tz} compact={compact} onOpen={() => setOpenId(m.id)} />
          ))}
        </div>
      )}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          className="gap-0 overflow-y-auto p-0 data-[side=right]:sm:max-w-md"
        >
          {open && <MomentDetail moment={open} tz={tz} onDismiss={() => dismiss(open.id)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MomentDetail({ moment, tz, onDismiss }: { moment: M; tz: string; onDismiss: () => void }) {
  const time = formatMomentClock(moment.recording.recorded_at, moment.start_ms, tz);
  return (
    <div className="flex flex-col gap-6 p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <div className="flex flex-wrap items-center gap-2 pr-8">
        <CategoryBadge category={moment.category} />
        <span className="font-mono text-xs text-ink-muted">{time ?? "Time unavailable"}</span>
        {moment.is_sample && <SampleBadge />}
      </div>
      <div className="flex flex-col gap-3">
        <SheetTitle className="display text-4xl">{moment.title}</SheetTitle>
        <SheetDescription className="text-base text-ink/80">{moment.summary}</SheetDescription>
      </div>

      <div className="rounded-card bg-secondary p-4">
        <p className="eyebrow mb-1.5">Why it matters</p>
        <p className="text-[0.9375rem]">{moment.importance_reason}</p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="eyebrow">What was said</p>
        <EvidenceQuote
          meta={
            <>
              {moment.recording.title} · {moment.start_ms != null ? formatOffset(moment.start_ms) : "timing unavailable"}
            </>
          }
        >
          {moment.evidence_text}
        </EvidenceQuote>
        <div className="flex flex-wrap items-center gap-3">
          <PlayClip
            recordingId={moment.recording_id}
            startMs={moment.start_ms}
            endMs={moment.end_ms}
            available={!moment.is_sample}
          />
          <ConfidenceMeter confidence={moment.confidence} />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href={`/memory/${moment.recording_id}${moment.start_ms != null ? `?t=${moment.start_ms}` : ""}#transcript`}
          className={cn(buttonVariants({ variant: "default" }), "sm:flex-1")}
        >
          <PlayCircle />
          Open recording
        </Link>
        <Button variant="ghost" onClick={onDismiss} className="sm:flex-1">
          <EyeOff />
          Dismiss
        </Button>
      </div>
    </div>
  );
}
