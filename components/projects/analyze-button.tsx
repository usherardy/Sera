"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/api";
import type { ProcessingStatus } from "@/lib/projects/types";

/** Analyze (first time), retry (after a failure) or re-run (replaces only unreviewed findings). */
export function AnalyzeButton({ conversationId, status }: { conversationId: string; status: ProcessingStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const label = status === "pending" ? "Analyze" : status === "failed" ? "Retry analysis" : "Re-run analysis";

  const run = async () => {
    setBusy(true);
    try {
      const res = await api<{ findings: number }>(`/api/conversations/${conversationId}/analyze`, "POST");
      toast.success(res.findings ? `Found ${res.findings} item${res.findings === 1 ? "" : "s"} to look at.` : "Analyzed. Nothing new found.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The analysis failed. Try again.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant={status === "completed" ? "outline" : "default"} size={status === "completed" ? "sm" : "default"} onClick={run} disabled={busy || status === "analyzing"}>
      {busy || status === "analyzing" ? <Loader2 className="animate-spin" /> : status === "pending" ? <Sparkles /> : <RotateCw />}
      {busy || status === "analyzing" ? "Analyzing…" : label}
    </Button>
  );
}
