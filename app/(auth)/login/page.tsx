import Link from "next/link";
import { Suspense } from "react";
import { FolderKanban, ListChecks, Quote } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Waveform } from "@/components/capture/waveform";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-5">
        <Link href="/welcome">
          <Logo />
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-5 py-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <section className="flex flex-col gap-7 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <p className="eyebrow">Change requests on autopilot</p>
          <h1 className="display text-[3.4rem] sm:text-[5.5rem]">
            Stop doing <em>free</em> work.
          </h1>
          <p className="max-w-md text-lg text-ink/75 sm:text-xl">
            Sera remembers what your client asked for, compares it with what you originally agreed, and
            shows the exact words, so scope creep becomes a conversation, not a surprise.
          </p>
          <div className="flex w-fit items-center gap-3 rounded-full border border-ink bg-ink py-2.5 pr-5 pl-4 text-cream">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-flare opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-flare" />
            </span>
            <Waveform />
            <span className="font-mono text-sm">“Can we also add Stripe payments?”</span>
          </div>
          <ul className="grid gap-3 text-sm sm:grid-cols-3">
            {[
              { icon: FolderKanban, t: "Agreement", d: "The original scope, on record." },
              { icon: Quote, t: "Evidence", d: "Exact quotes from every call." },
              { icon: ListChecks, t: "Follow-through", d: "Changes reviewed, then approved." },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex gap-3 sm:flex-col sm:gap-2">
                <Icon className="mt-0.5 size-5 shrink-0" />
                <span>
                  <span className="font-semibold">{t}.</span> <span className="text-ink-muted">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-raised flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex flex-col gap-1">
            <h2 className="display text-4xl">
              Welcome <em>back</em>
            </h2>
            <p className="text-sm text-ink-muted">Sign in or create an account to protect your next project.</p>
          </div>
          <Suspense fallback={<div className="h-80" />}>
            <LoginForm />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
