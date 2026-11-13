"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DESIGN_PREVIEW } from "@/lib/preview";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (DESIGN_PREVIEW) {
        router.push("/");
        return;
      }
      // Phase 1b: Supabase email + password auth.
      throw new Error("Auth not wired yet.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg border-2 border-cream-dark bg-paper p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md py-2 text-sm font-semibold transition-colors",
              mode === m ? "bg-dawn text-ink" : "text-ink/60 hover:text-ink",
            )}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>
      {mode === "signup" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" name="name" autoComplete="name" placeholder="Alex" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={8}
        />
      </div>
      {error && <p className="rounded-lg bg-error-bg px-3 py-2 text-sm font-medium text-pulse">{error}</p>}
      <Button type="submit" size="lg" disabled={busy} className="mt-1">
        {busy ? <Loader2 className="animate-spin" /> : null}
        {mode === "signin" ? "Sign in" : "Create account"}
        {!busy && <ArrowRight />}
      </Button>
      <p className="text-center text-xs text-ink-muted">
        Your recordings are private to your account. Delete anything, any time.
      </p>
    </form>
  );
}
