import { useState } from "react";

import { IMAGES } from "@/assets/images";
import {
  calculatePrice,
  EXPERIENCES,
  type ExperienceKey,
} from "@/config/pricing";
import {
  calculateStudioPrice,
  isStudioOfferingKey,
  STUDIO_OFFERINGS,
  type StudioOfferingKey,
} from "@/config/studio/offerings";
import { STEP_META } from "@/lib/booking-schema";
import { STUDIO_CLASS_STEP_META, STUDIO_STEP_META } from "@/lib/studio/booking-schema";
import { EXPERIENCE_IMAGES } from "./StepExperience";
import { EventGlance } from "./EventGlance";
import { StepPayment } from "./StepPayment";
import { StepShell } from "./StepShell";
import { STUDIO_OFFERING_IMAGES } from "@/components/studio/StepOffering";
import { SessionGlance } from "@/components/studio/SessionGlance";

export function offeringDisplay(experience: string | null | undefined): {
  kind: "photobooth" | "studio" | "class";
  experienceName: string;
  imageUrl?: string;
  experienceKey?: ExperienceKey;
  offeringKey?: StudioOfferingKey;
} {
  if (experience && experience in EXPERIENCES) {
    const key = experience as ExperienceKey;
    return {
      kind: "photobooth",
      experienceName: EXPERIENCES[key].name,
      imageUrl: EXPERIENCE_IMAGES[key].url,
      experienceKey: key,
    };
  }
  if (experience && isStudioOfferingKey(experience)) {
    const offering = STUDIO_OFFERINGS[experience];
    return {
      kind: offering.resource === "studio_acting" ? "class" : "studio",
      experienceName: offering.name,
      imageUrl: STUDIO_OFFERING_IMAGES[experience].url,
      offeringKey: experience,
    };
  }
  return { kind: "studio", experienceName: "Studio 7 booking" };
}

export type BalancePayModel = {
  bookingId: string;
  experienceName: string;
  imageUrl?: string | undefined;
  eventDate?: string | undefined;
  eventStartTime?: string | undefined;
  eventLocation?: string | undefined;
  totalCents: number;
  balanceCents: number;
  balanceDueDate?: string | null | undefined;
  kind?: "photobooth" | "studio" | "class";
  experienceKey?: ExperienceKey;
  offeringKey?: StudioOfferingKey;
  durationHours?: number | undefined;
  durationMinutes?: number | undefined;
  demo?: boolean;
};

export function BalancePayScreen({
  bookingId,
  experienceName,
  imageUrl,
  eventDate,
  eventStartTime,
  eventLocation,
  totalCents,
  balanceCents,
  balanceDueDate,
  kind = "photobooth",
  experienceKey,
  offeringKey,
  durationHours,
  durationMinutes,
  demo = false,
}: BalancePayModel) {
  const photobooth = kind === "photobooth";
  const stepLabels = photobooth ? STEP_META : kind === "class" ? STUDIO_CLASS_STEP_META : STUDIO_STEP_META;
  const step = kind === "class" ? 4 : 5;
  const due = balanceDueDate ?? "";
  const depositCents = Math.max(0, totalCents - balanceCents);

  const boothPrice = experienceKey
    ? calculatePrice({
        experience: experienceKey,
        durationHours: durationHours ?? EXPERIENCES[experienceKey].baseHours,
      })
    : null;
  const studioPrice = offeringKey
    ? calculateStudioPrice({
        offering: offeringKey,
        durationMinutes: durationMinutes ?? STUDIO_OFFERINGS[offeringKey].baseMinutes,
      })
    : null;

  const glanceContinue = () => undefined;

  const aside = photobooth ? (
    <EventGlance
      {...(experienceKey ? { experience: experienceKey } : {})}
      {...(eventDate ? { eventDate } : {})}
      {...(eventStartTime ? { eventStartTime } : {})}
      {...(eventLocation ? { eventLocation } : {})}
      {...(durationHours ? { durationHours } : {})}
      {...(boothPrice ? { price: boothPrice } : {})}
      onContinue={glanceContinue}
      disabled
      cta="Complete payment below"
    />
  ) : (
    <SessionGlance
      {...(offeringKey ? { offering: offeringKey } : {})}
      {...(eventDate ? { eventDate } : {})}
      {...(eventStartTime ? { eventStartTime } : {})}
      {...(durationMinutes ? { durationMinutes } : {})}
      {...(studioPrice ? { price: studioPrice } : {})}
      onContinue={glanceContinue}
      disabled
      cta="Complete payment below"
      hidePhoto
    />
  );

  const footer = photobooth ? (
    <EventGlance
      {...(experienceKey ? { experience: experienceKey } : {})}
      {...(eventDate ? { eventDate } : {})}
      {...(eventStartTime ? { eventStartTime } : {})}
      {...(boothPrice ? { price: boothPrice } : {})}
      onContinue={glanceContinue}
      disabled
      cta="Complete payment below"
      compact
    />
  ) : (
    <SessionGlance
      {...(offeringKey ? { offering: offeringKey } : {})}
      {...(eventDate ? { eventDate } : {})}
      {...(eventStartTime ? { eventStartTime } : {})}
      {...(studioPrice ? { price: studioPrice } : {})}
      onContinue={glanceContinue}
      disabled
      cta="Complete payment below"
      compact
    />
  );

  return (
    <StepShell
      step={step}
      title="Secure your date"
      supporting=""
      stepLabels={stepLabels}
      logoSrc={photobooth ? IMAGES.photoboothLogo : IMAGES.logo}
      logoAlt={photobooth ? "Studio 7 Photobooth" : "Studio 7 Miami"}
      aside={aside}
      footer={footer}
    >
      <StepPayment
        bookingId={bookingId}
        experienceName={experienceName}
        {...(imageUrl ? { imageUrl } : {})}
        {...(eventDate ? { eventDate } : {})}
        {...(eventStartTime ? { eventStartTime } : {})}
        totalCents={totalCents}
        depositCents={depositCents}
        balanceCents={balanceCents}
        balanceDueDate={due}
        remainingOnly
        demo={demo}
      />
    </StepShell>
  );
}
