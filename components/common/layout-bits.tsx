import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Page title in serif display with an optional italic accent: <PageHeader title={<>Your <em>memory</em></>} /> */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="display text-[2.75rem] sm:text-6xl">{title}</h1>
        {subtitle && <p className="max-w-xl text-base text-ink-muted sm:text-lg">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function SectionHeader({
  title,
  href,
  linkLabel,
  count,
}: {
  title: ReactNode;
  href?: string;
  linkLabel?: string;
  count?: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="display text-3xl sm:text-[2.25rem]">
        {title}
        {count != null && (
          <span className="ml-2 align-middle font-mono text-sm tracking-normal text-ink-muted">
            {count}
          </span>
        )}
      </h2>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-ink hover:underline"
        >
          {linkLabel ?? "See all"}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border-2 border-dashed border-cream-dark px-6 py-10 text-center",
        className,
      )}
    >
      {icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-dawn text-ink [&_svg]:size-5">
          {icon}
        </div>
      )}
      <p className="display text-2xl">{title}</p>
      {body && <p className="max-w-sm text-sm text-ink-muted">{body}</p>}
      {action}
    </div>
  );
}

/** Verbatim transcript evidence, styled as a pull quote */
export function EvidenceQuote({
  children,
  meta,
  className,
}: {
  children: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <figure className={cn("border-l-[3px] border-dawn-strong pl-4", className)}>
      <blockquote className="font-serif text-lg leading-snug italic">“{children}”</blockquote>
      {meta && <figcaption className="eyebrow mt-2">{meta}</figcaption>}
    </figure>
  );
}
