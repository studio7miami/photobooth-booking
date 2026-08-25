import { useLayoutEffect, useRef, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { IMAGES } from "@/assets/images";
import { cn } from "@/lib/utils";
import { Stepper, type StepMeta } from "./Stepper";

function pinWindowToTop(blurFocused = false) {
  if (blurFocused) {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) {
      active.blur();
    }
  }
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

type StepShellProps = {
  step: number;
  title: string;
  supporting: string;
  children: ReactNode;
  aside?: ReactNode;
  /** Left-column media for the equal-width spread layout. */
  media?: ReactNode;
  /** Slim recap docked to the bottom of the right column on desktop. */
  recap?: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  stepLabels?: StepMeta;
};

export function StepShell({
  step,
  title,
  supporting,
  children,
  aside,
  media,
  recap,
  footer,
  onBack,
  stepLabels,
}: StepShellProps) {
  const spread = Boolean(media);
  const desktopChrome = Boolean(aside || spread);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    let active = true;
    const until = performance.now() + 400;
    const pin = (blur = false) => {
      if (!active || performance.now() > until) return;
      pinWindowToTop(blur);
    };
    pin(true);
    headingRef.current?.focus({ preventScroll: true });
    const frame = requestAnimationFrame(() => pin());
    const onLoad = () => pin();
    const images = Array.from(document.querySelectorAll("main img"));
    for (const image of images) image.addEventListener("load", onLoad);
    const retry = window.setTimeout(() => pin(), 120);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      window.clearTimeout(retry);
      for (const image of images) image.removeEventListener("load", onLoad);
    };
  }, [step]);

  const heading = (
    <div>
      {title ? (
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-[1.35rem] leading-[1.1] text-balance outline-none sm:text-[1.75rem] sm:leading-[1.08]"
        >
          {title}
        </h1>
      ) : null}
      {supporting ? (
        <p className="mt-1.5 text-[0.95rem] text-muted-foreground sm:text-base">
          {supporting}
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="flex min-h-svh flex-col [overflow-anchor:none]">
      <header className="sticky top-0 z-20 border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-2.5 sm:gap-6 sm:px-5 sm:py-3">
          <img
            src={IMAGES.logo}
            alt="Studio 7 Miami"
            className="h-11 w-auto shrink-0 object-contain sm:h-12 lg:h-14"
          />
          <Stepper step={step} {...(stepLabels ? { steps: stepLabels } : {})} />
        </div>
      </header>

      <main
        className={cn(
          "mx-auto w-full max-w-6xl flex-1 overflow-x-clip px-4 pt-4 sm:px-5 sm:pt-5",
          footer && !desktopChrome
            ? "pb-48 sm:pb-52"
            : footer
              ? spread
                ? "pb-48 lg:pb-8"
                : "pb-48 lg:pb-16"
              : "pb-16",
        )}
      >
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

        {spread ? (
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
            <div className="overflow-hidden rounded-[24px] border border-border leading-[0]">
              {media}
            </div>
            <div className="flex min-w-0 flex-col lg:self-stretch">
              {heading}
              <div className="mt-4 sm:mt-5">{children}</div>
              {recap ? (
                <>
                  <div className="hidden lg:block lg:min-h-6 lg:flex-1" aria-hidden="true" />
                  <div className="mt-6 hidden border-t border-border pt-5 lg:mt-0 lg:block">
                    {recap}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ) : (
          <div
            className={
              aside ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12" : "grid gap-10"
            }
          >
            <div className="min-w-0">
              {heading}
              <div className="mt-4 sm:mt-5">{children}</div>
            </div>

            {aside ? (
              <aside className="hidden lg:block">
                <div className="sticky top-20">{aside}</div>
              </aside>
            ) : null}
          </div>
        )}
      </main>

      {footer ? (
        <div
          className={`fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background${
            desktopChrome ? " lg:hidden" : ""
          }`}
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
