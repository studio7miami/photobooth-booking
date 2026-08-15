import { Check } from "lucide-react";
import { STEP_META, TOTAL_STEPS } from "@/lib/booking-schema";
import { cn } from "@/lib/utils";

export function Stepper({ step }: { step: number }) {
  const current = STEP_META[Math.min(Math.max(step, 1), TOTAL_STEPS) - 1]!;
  const pct = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);

  return (
    <div
      className="min-w-0 flex-1"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={TOTAL_STEPS}
      aria-valuenow={step}
      aria-label={`${current.label}, step ${step} of ${TOTAL_STEPS}`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-x-[8%] top-1/2 h-px -translate-y-1/2 bg-[var(--line)]" />
          <div
            className="absolute left-[8%] top-1/2 h-px -translate-y-1/2 bg-[var(--ink)] transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `calc(84% * ${pct} / 100)` }}
          />
          <ol className="relative grid grid-cols-5">
            {STEP_META.map((s) => {
              const done = s.step < step;
              const active = s.step === step;
              return (
                <li key={s.step} className="flex justify-center">
                  <span
                    className={cn(
                      "flex size-3.5 items-center justify-center rounded-full border transition-colors duration-300 ease-out motion-reduce:transition-none sm:size-4",
                      done || active
                        ? "border-[var(--ink)] bg-[var(--ink)]"
                        : "border-[var(--line)] bg-background",
                    )}
                  >
                    {done ? (
                      <Check className="size-2 text-background sm:size-2.5" aria-hidden="true" />
                    ) : active ? (
                      <span className="size-1 rounded-full bg-background" />
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        <span className="label-caps hidden shrink-0 text-[9px] text-muted-foreground sm:inline">
          {current.label}
        </span>
      </div>
    </div>
  );
}
