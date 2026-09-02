import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { IMAGES } from "@/assets/images";
import { calculatePrice, EXPERIENCES } from "@/config/pricing";
import { EXPERIENCE_IMAGES } from "@/components/booking/StepExperience";
import { EventGlance } from "@/components/booking/EventGlance";
import { BalancePayScreen } from "@/components/booking/BalancePayScreen";
import { StepPayment } from "@/components/booking/StepPayment";
import { StepShell } from "@/components/booking/StepShell";
import { STEP_META } from "@/lib/booking-schema";
import { cn } from "@/lib/utils";

const PREVIEW_BOOKING_ID = "00000000-0000-4000-8000-000000000001";

const SAMPLE = {
  experience: "classic" as const,
  experienceName: "The Miami Classic",
  imageUrl: EXPERIENCE_IMAGES.classic.url,
  eventDate: "2026-09-30",
  eventStartTime: "21:00",
  eventLocation: "The Setai, 2001 Collins Ave, Miami Beach, FL 33139",
  durationHours: EXPERIENCES.classic.baseHours,
  totalCents: 25000,
  depositCents: 12500,
  balanceCents: 12500,
  balanceDueDate: "2026-09-23",
};

const PRICE = calculatePrice({
  experience: SAMPLE.experience,
  durationHours: SAMPLE.durationHours,
});

export const Route = createFileRoute("/pay-preview")({
  head: () => ({
    meta: [{ title: "Pay screens — Studio 7 Miami" }],
  }),
  component: PayPreview,
});

function PayPreview() {
  const [half, setHalf] = useState<"first" | "second">("first");
  const glance = {
    experience: SAMPLE.experience,
    eventDate: SAMPLE.eventDate,
    eventStartTime: SAMPLE.eventStartTime,
    eventLocation: SAMPLE.eventLocation,
    durationHours: SAMPLE.durationHours,
    price: PRICE,
    onContinue: () => undefined,
    disabled: true,
    cta: "Complete payment below",
  };

  return (
    <div>
      <div className="border-b border-border bg-background px-4 py-3 sm:px-5">
        <p className="label-caps text-[10px] text-muted-foreground">Internal preview</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setHalf("first")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] transition-colors",
              half === "first"
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background hover:border-foreground/40",
            )}
          >
            First half · deposit
          </button>
          <button
            type="button"
            onClick={() => setHalf("second")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] transition-colors",
              half === "second"
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background hover:border-foreground/40",
            )}
          >
            Second half · remaining
          </button>
        </div>
      </div>

      {half === "first" ? (
        <StepShell
          step={5}
          title="Secure your date"
          supporting=""
          stepLabels={STEP_META}
          logoSrc={IMAGES.photoboothLogo}
          logoAlt="Studio 7 Photobooth"
          aside={<EventGlance {...glance} />}
          footer={<EventGlance {...glance} compact />}
        >
          <StepPayment
            bookingId={PREVIEW_BOOKING_ID}
            experienceName={SAMPLE.experienceName}
            imageUrl={SAMPLE.imageUrl}
            eventDate={SAMPLE.eventDate}
            eventStartTime={SAMPLE.eventStartTime}
            totalCents={SAMPLE.totalCents}
            depositCents={SAMPLE.depositCents}
            balanceCents={SAMPLE.balanceCents}
            balanceDueDate={SAMPLE.balanceDueDate}
            demo
          />
        </StepShell>
      ) : (
        <BalancePayScreen
          bookingId={PREVIEW_BOOKING_ID}
          experienceName={SAMPLE.experienceName}
          imageUrl={SAMPLE.imageUrl}
          eventDate={SAMPLE.eventDate}
          eventStartTime={SAMPLE.eventStartTime}
          eventLocation={SAMPLE.eventLocation}
          totalCents={SAMPLE.totalCents}
          balanceCents={SAMPLE.balanceCents}
          balanceDueDate={SAMPLE.balanceDueDate}
          kind="photobooth"
          experienceKey={SAMPLE.experience}
          durationHours={SAMPLE.durationHours}
          demo
        />
      )}
    </div>
  );
}
