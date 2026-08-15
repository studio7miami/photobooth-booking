import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { IMAGES } from "@/assets/images";
import { Stepper } from "./Stepper";

type StepShellProps = {
  step: number;
  title: string;
  supporting: string;
  children: ReactNode;
  aside?: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
};

export function StepShell({
  step,
  title,
  supporting,
  children,
  aside,
  footer,
  onBack,
}: StepShellProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-2.5 sm:gap-6 sm:px-5 sm:py-3">
          <img
            src={IMAGES.logo}
            alt="Studio 7 Miami"
            className="h-11 w-auto shrink-0 object-contain sm:h-12 lg:h-14"
          />
          <Stepper step={step} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 overflow-x-clip px-4 pt-4 pb-40 sm:px-5 sm:pt-5 lg:pb-16">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="label-caps -ml-1 mb-4 inline-flex items-center gap-2 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back
          </button>
        ) : null}

        <div
          className={
            aside
              ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12"
              : "grid gap-10"
          }
        >
          <div className="min-w-0">
            <div>
              {title ? (
                <h1 className="text-[1.35rem] leading-[1.1] text-balance sm:text-[1.75rem] sm:leading-[1.08]">
                  {title}
                </h1>
              ) : null}
              <p className="mt-1.5 max-w-xl text-[0.95rem] text-muted-foreground sm:text-base">
                {supporting}
              </p>
            </div>
            <div className="mt-4 sm:mt-5">{children}</div>
          </div>

          {aside ? (
            <aside className="hidden lg:block">
              <div className="sticky top-20">{aside}</div>
            </aside>
          ) : null}
        </div>
      </main>

      {footer ? (
        <div
          className={`fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background${aside ? " lg:hidden" : ""}`}
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-4">
            {footer}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PillButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean | undefined;
  onClick?: (() => void) | undefined;
  type?: "button" | "submit" | undefined;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="label-caps inline-flex h-14 w-full items-center justify-center rounded-full bg-primary px-8 text-[11px] text-primary-foreground shadow-[0_6px_16px_-8px_oklch(0.24_0_0/0.45)] transition-all hover:brightness-110 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
    >
      {children}
    </button>
  );
}

export function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return <p className="mt-2 text-sm text-destructive">{message}</p>;
}
