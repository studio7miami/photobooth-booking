import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared monochrome editorial card system.
 * Every surface in the app (experience, review, checkout, confirmation)
 * is built from these primitives so the anatomy never drifts.
 */
export function EdCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("ed-card p-5 sm:p-8", className)}>{children}</div>;
}

/** Header row: name large left, secondary figure right on the same baseline. */
export function EdHeader({
  title,
  figure,
  eyebrow,
}: {
  title: ReactNode;
  figure?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <header>
      {eyebrow ? (
        <p className="label-caps text-[10px] text-muted-foreground">{eyebrow}</p>
      ) : null}
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl leading-tight">{title}</h2>
        {figure ? (
          <span className="shrink-0 font-display text-lg tabular-nums">{figure}</span>
        ) : null}
      </div>
    </header>
  );
}

/** Spec list: label-left / value-right rows split by hairlines. */
export function EdSpecs({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn("mt-6", className)}>{children}</dl>;
}

export function EdSpec({
  label,
  value,
  strong,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="ed-hairline flex items-baseline justify-between gap-4 py-3 last:border-b-0">
      <dt className="label-caps text-[10px] text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-right tabular-nums whitespace-nowrap",
          strong ? "font-display text-base" : "text-sm",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function EdBody({ children }: { children: ReactNode }) {
  return <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{children}</p>;
}

/** Primary action: solid ink pill, uppercase label. */
export function EdPrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "ed-pill w-full px-6 py-3.5 text-[11px] transition-opacity hover:opacity-90 disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Secondary action: hairline outline ghost, used only for a real second action. */
export function EdSecondaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "label-caps w-full rounded-full border border-border px-6 py-3.5 text-[11px] text-foreground transition-colors hover:bg-accent disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function EdCaption({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-center text-xs text-muted-foreground">{children}</p>;
}
