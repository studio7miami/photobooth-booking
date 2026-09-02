import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { StepOffering } from "@/components/studio/StepOffering";
import { StepShell } from "@/components/booking/StepShell";
import {
  MOTION_VARIANT_META,
  MOTION_VARIANTS,
  MotionProvider,
  type MotionVariant,
} from "@/components/booking/motion";
import { STUDIO_STEP_META } from "@/lib/studio/booking-schema";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/motion-preview")({
  head: () => ({
    meta: [{ title: "Motion preview — Studio 7 Miami" }],
  }),
  component: MotionPreview,
});

export function MotionPreview() {
  const [variant, setVariant] = useState<MotionVariant>("rise");
  const [play, setPlay] = useState(0);
  const meta = MOTION_VARIANT_META[variant];

  return (
    <div className="min-h-svh bg-background">
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="label-caps text-[10px] text-muted-foreground">Internal preview</p>
            <p className="truncate text-sm">
              {meta.letter} · {meta.label} — {meta.note}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {MOTION_VARIANTS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setVariant(id);
                  setPlay((n) => n + 1);
                }}
                className={cn(
                  "label-caps rounded-full border px-3 py-1.5 text-[10px] transition-colors",
                  variant === id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground/40",
                )}
              >
                {MOTION_VARIANT_META[id].letter} · {MOTION_VARIANT_META[id].label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPlay((n) => n + 1)}
              className="label-caps rounded-full border border-border px-3 py-1.5 text-[10px] hover:border-foreground/40"
            >
              Replay
            </button>
            <a
              href={`/?motion=${variant}`}
              className="label-caps rounded-full border border-border px-3 py-1.5 text-[10px] hover:border-foreground/40"
            >
              Open live
            </a>
          </div>
        </div>
      </div>

      <MotionProvider variant={variant} replayKey={`${variant}-${play}`}>
        <StepShell
          step={1}
          title="Book your session"
          supporting="Studio rentals, portraits, sports media, headshots, and class — pick what you need."
          stepLabels={STUDIO_STEP_META}
        >
          <StepOffering onChange={() => undefined} />
        </StepShell>
      </MotionProvider>
    </div>
  );
}
