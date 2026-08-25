import { Check } from "lucide-react";
import { STEP_META, TOTAL_STEPS } from "@/lib/booking-schema";
import { cn } from "@/lib/utils";

export type StepMeta = readonly { step: number; label: string; microcopy: string }[];

export function Stepper({ step, steps = STEP_META }: { step: number; steps?: StepMeta }) {
  const total = steps.length || TOTAL_STEPS;
  const current = steps[Math.min(Math.max(step, 1), total) - 1]!;
  const pct = Math.round(((step - 1) / (total - 1)) * 100);

  return (
    <div
      className="min-w-0 flex-1"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={step}
      aria-label={`${current.label}, step ${step} of ${total}`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-x-[8%] top-1/2 h-px -translate-y-1/2 bg-[var(--line)]" />
          <div
            className="absolute left-[8%] top-1/2 h-px -translate-y-1/2 bg-[var(--ink)] transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `calc(84% * ${pct} / 100)` }}
          />
          <ol className={cn("relative grid", total === 4 ? "grid-cols-4" : "grid-cols-5")}>
            {steps.map((s) => {
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
