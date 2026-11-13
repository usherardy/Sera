import Link from "next/link";
import { CheckSquare, Library, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Waveform } from "@/components/capture/waveform";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-5">
        <Link href="/">
          <Logo />
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-5 py-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <section className="flex flex-col gap-7 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <p className="eyebrow">AI memory · follow-through</p>
          <h1 className="display text-[3.4rem] sm:text-[5.5rem]">
            Your day, <em>remembered.</em>
          </h1>
          <p className="max-w-md text-lg text-ink/75 sm:text-xl">
            What matters, captured. What you promise, done. Record your conversations; FollowThrough finds the
            decisions and commitments, and helps you keep them.
          </p>
          <div className="flex w-fit items-center gap-3 rounded-full border-2 border-ink bg-ink py-2.5 pr-5 pl-4 text-cream">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-flare opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-flare" />
            </span>
            <Waveform />
            <span className="font-mono text-sm">“I&apos;ll send it by Friday.”</span>
          </div>
          <ul className="grid gap-3 text-sm sm:grid-cols-3">
            {[
              { icon: Library, t: "Memory", d: "Every conversation, summarized." },
              { icon: Sparkles, t: "Moments", d: "Decisions and key info, with proof." },
              { icon: CheckSquare, t: "Actions", d: "Promises become approved tasks." },
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
            <p className="text-sm text-ink-muted">Sign in or create an account to start capturing.</p>
          </div>
          <LoginForm />
        </section>
      </main>
    </div>
  );
}
