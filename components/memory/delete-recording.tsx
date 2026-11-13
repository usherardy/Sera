"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DESIGN_PREVIEW } from "@/lib/preview";

export function DeleteRecording({ recordingId, title }: { recordingId: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      if (DESIGN_PREVIEW) {
        toast("Preview: nothing was deleted.");
      } else {
        const res = await fetch(`/api/recordings/${recordingId}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        toast.success("Recording deleted.");
        router.push("/memory");
        router.refresh();
      }
      setOpen(false);
    } catch {
      toast.error("Couldn't delete the recording. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 />
        Delete recording
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <div className="flex flex-col gap-2">
            <DialogTitle className="display text-3xl">
              Delete <em>for good?</em>
            </DialogTitle>
            <DialogDescription className="text-ink/80">
              This permanently deletes “{title}”: the audio, transcript, moments and tasks that came from it. Events
              already added to Google Calendar stay there.
            </DialogDescription>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Keep it
            </Button>
            <Button variant="ink" onClick={confirm} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
