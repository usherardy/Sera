"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/api";
import { createClient } from "@/lib/supabase/browser";
import { DESIGN_PREVIEW } from "@/lib/preview";

function useBusy() {
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  };
  return { busy, run };
}

const previewNote = () => toast("Design preview: connect Supabase to enable this.");

export function TimezoneButton({ current }: { current: string }) {
  const router = useRouter();
  const { busy, run } = useBusy();
  return (
    <Button
      variant="ghost"
      disabled={!!busy}
      onClick={() =>
        DESIGN_PREVIEW
          ? previewNote()
          : run("tz", async () => {
              const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
              if (tz === current) {
                toast(`Already set to ${tz}.`);
                return;
              }
              const supabase = createClient();
              const { data } = await supabase.auth.getClaims();
              const { error } = await supabase.from("profiles").update({ timezone: tz }).eq("id", data?.claims?.sub ?? "");
              if (error) throw new Error("Couldn't update your timezone.");
              toast.success(`Timezone set to ${tz}.`);
              router.refresh();
            })
      }
    >
      {busy === "tz" && <Loader2 className="animate-spin" />}
      Use this device&apos;s
    </Button>
  );
}

export function SampleDayButtons() {
  const router = useRouter();
  const { busy, run } = useBusy();
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        disabled={!!busy}
        onClick={() =>
          DESIGN_PREVIEW
            ? previewNote()
            : run("load", async () => {
                const { id } = await api<{ id: string }>("/api/demo/seed", "POST");
                toast.success("Demo data loaded. Every item is labeled Sample.");
                router.push(`/projects/${id}`);
                router.refresh();
              })
        }
      >
        {busy === "load" && <Loader2 className="animate-spin" />}
        Load
      </Button>
      <Button
        variant="ghost"
        disabled={!!busy}
        onClick={() =>
          DESIGN_PREVIEW
            ? previewNote()
            : run("remove", async () => {
                await api("/api/demo/seed", "DELETE");
                toast.success("Demo data removed.");
                router.refresh();
              })
        }
      >
        {busy === "remove" && <Loader2 className="animate-spin" />}
        Remove
      </Button>
    </div>
  );
}

export function SignOutButton() {
  const router = useRouter();
  const { busy, run } = useBusy();
  return (
    <Button
      variant="ghost"
      disabled={!!busy}
      onClick={() =>
        DESIGN_PREVIEW
          ? router.push("/login")
          : run("out", async () => {
              await createClient().auth.signOut();
              router.replace("/login");
              router.refresh();
            })
      }
    >
      {busy === "out" && <Loader2 className="animate-spin" />}
      Sign out
    </Button>
  );
}
