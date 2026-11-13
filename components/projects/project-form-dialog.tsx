"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client/api";
import type { ProjectInputT } from "@/lib/projects/schemas";
import type { Project } from "@/lib/projects/types";

const lines = (s: string) =>
  s
    .split("\n")
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);

function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

/**
 * Create a project, or (with `project`) explicitly edit its original agreement.
 * `initial` pre-fills a new project (e.g. an AI draft from a recording) and
 * `onCreated` replaces the default "go to the project" behaviour.
 */
export function ProjectFormDialog({
  project,
  initial,
  open,
  onOpenChange,
  onCreated,
  drafted = false,
}: {
  project?: Project;
  initial?: Partial<ProjectInputT>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void | Promise<void>;
  /** show the "drafted from your recording" note */
  drafted?: boolean;
}) {
  const router = useRouter();
  const editing = !!project;
  const src = project ?? initial;
  const [name, setName] = useState(src?.name ?? "");
  const [client, setClient] = useState(src?.client_name ?? "");
  const [description, setDescription] = useState(src?.original_description ?? "");
  const [scope, setScope] = useState(src?.agreed_scope?.join("\n") ?? "");
  const [exclusions, setExclusions] = useState(src?.exclusions?.join("\n") ?? "");
  const [price, setPrice] = useState(src?.fixed_price != null ? String(src.fixed_price) : "");
  const [currency, setCurrency] = useState(src?.currency ?? "EUR");
  const [deadline, setDeadline] = useState(src?.deadline ?? "");
  const [busy, setBusy] = useState(false);

  const scopeItems = lines(scope);
  const priceNum = price.trim() === "" ? null : Number(price);
  const priceBad = priceNum != null && (!Number.isFinite(priceNum) || priceNum < 0);
  const valid = name.trim() && client.trim() && scopeItems.length > 0 && !priceBad && /^[A-Za-z]{3}$/.test(currency.trim());

  const save = async () => {
    setBusy(true);
    try {
      const body = {
        name: name.trim(),
        client_name: client.trim(),
        original_description: description.trim(),
        agreed_scope: scopeItems,
        exclusions: lines(exclusions),
        fixed_price: priceNum,
        currency: currency.trim().toUpperCase(),
        deadline: deadline || null,
      };
      if (editing) {
        await api(`/api/projects/${project.id}`, "PATCH", body);
        toast.success("Agreement updated.");
        onOpenChange(false);
        router.refresh();
      } else {
        const { id } = await api<{ id: string }>("/api/projects", "POST", body);
        toast.success("Project created.");
        onOpenChange(false);
        if (onCreated) await onCreated(id);
        else router.push(`/projects/${id}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <div className="flex flex-col gap-1">
          <DialogTitle className="display text-3xl">
            {editing ? (
              <>
                Edit the <em>agreement</em>
              </>
            ) : (
              <>
                New <em>project</em>
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-ink-muted">
            {editing
              ? "This changes the ORIGINAL agreement that every conversation is compared against. Do this only if both sides actually agreed to the change."
              : drafted
                ? "SERA drafted this from your recording. Check every field: only what was actually said is filled in. Nothing is saved until you press Create."
                : "Enter what you and the client originally agreed. Every conversation is compared against this."}
          </DialogDescription>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project name" htmlFor="p-name">
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Studio Website" autoFocus />
          </Field>
          <Field label="Client" htmlFor="p-client">
            <Input id="p-client" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Acme Studio" />
          </Field>
        </div>

        <Field label="Description" htmlFor="p-desc" hint="Optional. A sentence or two on what the project is.">
          <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-16" />
        </Field>

        <Field label="Agreed deliverables" htmlFor="p-scope" hint="One per line. This is the baseline. Be specific; vague scope means vague findings.">
          <Textarea id="p-scope" value={scope} onChange={(e) => setScope(e.target.value)} placeholder={"Homepage\nContact page\nResponsive design"} className="min-h-28" />
        </Field>

        <Field label="Not included / constraints" htmlFor="p-excl" hint="Optional, one per line. Things explicitly out of scope.">
          <Textarea id="p-excl" value={exclusions} onChange={(e) => setExclusions(e.target.value)} placeholder={"Payment integration\nCustomer accounts"} className="min-h-20" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-[1fr_6rem_1fr]">
          <Field label="Fixed price" htmlFor="p-price">
            <Input id="p-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="500" aria-invalid={priceBad} />
          </Field>
          <Field label="Currency" htmlFor="p-cur">
            <Input id="p-cur" value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
          </Field>
          <Field label="Original deadline" htmlFor="p-deadline">
            <Input id="p-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!valid || busy}>
            {busy && <Loader2 className="animate-spin" />}
            {editing ? "Save agreement" : "Create project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function NewProjectButton({
  size = "default",
  variant = "default",
  label = "New project",
}: {
  size?: "default" | "lg" | "sm";
  variant?: "default" | "outline" | "ghost";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size={size} variant={variant} onClick={() => setOpen(true)}>
        <Plus />
        {label}
      </Button>
      {open && <ProjectFormDialog open={open} onOpenChange={setOpen} />}
    </>
  );
}

export function EditAgreementButton({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil />
        Edit agreement
      </Button>
      {open && <ProjectFormDialog project={project} open={open} onOpenChange={setOpen} />}
    </>
  );
}
