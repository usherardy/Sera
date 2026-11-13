"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client/api";
import { DEMO_EMAIL, DEMO_PASSWORD, isDemoEmail } from "@/lib/demo-account";
import { createClient } from "@/lib/supabase/browser";
import { DESIGN_PREVIEW } from "@/lib/preview";
import { cn } from "@/lib/utils";

function friendly(message: string) {
  if (/invalid login credentials/i.test(message)) return "That email and password don't match. Try again or create an account.";
  if (/already registered/i.test(message)) return "There's already an account with that email. Sign in instead.";
  if (/password should be at least/i.test(message)) return "Use a password of at least 8 characters.";
  if (/email not confirmed/i.test(message)) return "Confirm your email first. Check your inbox for the link.";
  return message;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(params.get("mode") === "signup" ? "signup" : "signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (DESIGN_PREVIEW) {
      router.push("/");
      return;
    }
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();
    setBusy(true);
    try {
      const supabase = createClient();
      if (mode === "signin" && isDemoEmail(email)) {
        // The shared demo account: the server signs in (creating it on first use) and loads sample data.
        await api("/api/demo/login", "POST");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || null, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Check your email to confirm your account, then sign in.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(friendly(err instanceof Error ? err.message : "Something went wrong. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-cream-dark bg-paper p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
              setNotice(null);
            }}
            className={cn(
              "rounded-md py-2 text-sm font-semibold transition-colors",
              mode === m ? "bg-dawn text-ink" : "text-ink/60 hover:text-ink",
            )}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>
      {mode === "signin" ? (
        <p className="flex items-center gap-2 rounded-lg bg-dawn/70 px-3 py-2.5 text-sm text-ink/80">
          <Sparkles className="size-4 shrink-0" />
          <span>
            <span className="font-semibold text-ink">Demo account filled in.</span> Just press Sign in.
          </span>
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" name="name" autoComplete="name" placeholder="Alex" />
        </div>
      )}
      {/* key={mode}: the demo values fill the Sign in tab only; Create account starts empty. */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          key={`email-${mode}`}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          defaultValue={mode === "signin" ? DEMO_EMAIL : undefined}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          key={`password-${mode}`}
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={8}
          defaultValue={mode === "signin" ? DEMO_PASSWORD : undefined}
        />
      </div>
      {error && <p className="rounded-lg bg-error-bg px-3 py-2 text-sm font-medium text-pulse">{error}</p>}
      {notice && <p className="rounded-lg bg-success px-3 py-2 text-sm font-medium text-success-dark">{notice}</p>}
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
