"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/api";

const FLAG = "sera:demo-autoloaded";

function flagged() {
  try {
    return localStorage.getItem(FLAG) === "1";
  } catch {
    return true; // storage blocked: don't auto-load, the button still works
  }
}
function setFlag() {
  try {
    localStorage.setItem(FLAG, "1");
  } catch {
    // ignore
  }
}

/**
 * Shown when the account has no projects. Loads the labeled demo data once per
 * browser so the app isn't empty, and offers a button to load it again.
 */
export function DemoAutoload() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  const load = async (auto: boolean) => {
    setBusy(true);
    setFlag();
    try {
      await api<{ id: string }>("/api/demo/seed", "POST");
      toast.success(auto ? "Loaded demo data so you can look around. Everything is labeled Sample." : "Demo data loaded.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't load the demo data.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (started.current || flagged()) return;
    started.current = true;
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="surface flex flex-col items-center gap-3 p-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-dawn [&_svg]:size-5">
        <Database />
      </span>
      <p className="display text-2xl">No projects yet.</p>
      <p className="max-w-md text-sm text-ink-muted">
        Record a call above, or explore Sera with two labeled sample projects: conversations, summaries, example findings and tasks.
      </p>
      <Button variant="outline" disabled={busy} onClick={() => void load(false)}>
        {busy && <Loader2 className="animate-spin" />}
        {busy ? "Loading demo data…" : "Load demo data"}
      </Button>
    </div>
  );
}
