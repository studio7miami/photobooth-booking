import { z } from "zod";
import {
  STUDIO_OFFERING_KEYS,
  STUDIO_OFFERINGS,
  type StudioOfferingKey,
} from "@/config/studio/offerings";
import { STUDIO_LOCATION } from "@/config/studio/booking-rules";
import { todayInBookingZone } from "@/config/booking-rules";

export const studioOfferingSchema = z.object({
  offering: z.enum(STUDIO_OFFERING_KEYS),
});

export const studioTimeSchema = z
  .object({
    eventDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Choose your date" })
      .refine((d) => d >= todayInBookingZone(), {
        message: "Pick a date that's still open",
      }),
    eventStartTime: z.string().regex(/^\d{2}:\d{2}$/, { message: "Choose a start time" }),
    durationMinutes: z.number().int().min(15).max(540),
    classSessionId: z.string().min(1).max(40).optional(),
    shooterId: z.string().min(1).max(80).optional(),
    shooterName: z.string().min(1).max(120).optional(),
  })
  .strict();

export const studioDetailsSchema = z.object({
  clientName: z.string().trim().min(2, { message: "Enter your full name" }).max(120),
  clientPhone: z
    .string()
    .trim()
    .min(7, { message: "Enter a reachable phone number" })
    .max(32)
    .regex(/^[0-9+()\-.\s]+$/, { message: "Numbers only, please" }),
  clientEmail: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  clientNotes: z.string().trim().max(500).optional(),
});

export const studioBookingDetailsSchema = studioOfferingSchema
  .extend(studioTimeSchema.shape)
  .extend({
    clientName: z.string().trim().min(2).max(120),
    clientPhone: z.string().trim().min(7).max(32),
    clientEmail: z.string().trim().email().max(255),
    clientNotes: z.string().trim().max(500).optional(),
    eventLocation: z.string().trim().min(4).max(240).default(STUDIO_LOCATION),
  })
  .superRefine((data, ctx) => {
    if (STUDIO_OFFERINGS[data.offering].assignsShooter && !data.shooterId) {
      ctx.addIssue({
        code: "custom",
        path: ["shooterId"],
        message: "Choose your shooter",
      });
    }
  });

export type StudioBookingDetails = z.infer<typeof studioBookingDetailsSchema>;
export type StudioBookingDraft = {
  [K in keyof StudioBookingDetails]?: StudioBookingDetails[K] | undefined;
};

export function skipsStudioAgreement(offering: StudioOfferingKey | undefined): boolean {
  return Boolean(offering && STUDIO_OFFERINGS[offering]?.resource === "studio_acting");
}

export const STUDIO_TOTAL_STEPS = 5;

export const STUDIO_STEP_META = [
  { step: 1, label: "Experience", microcopy: "Let's start with the session." },
  { step: 2, label: "Date & time", microcopy: "When should we see you?" },
  { step: 3, label: "Your details", microcopy: "Almost there — just the essentials." },
  { step: 4, label: "Review & sign", microcopy: "You're one signature from booked." },
  { step: 5, label: "Payment", microcopy: "Last step. Then it's official." },
] as const;

export const STUDIO_CLASS_STEP_META = [
  { step: 1, label: "Experience", microcopy: "Let's start with the session." },
  { step: 2, label: "Date & time", microcopy: "When should we see you?" },
  { step: 3, label: "Your details", microcopy: "Almost there — just the essentials." },
  { step: 4, label: "Payment", microcopy: "Last step. Then it's official." },
] as const;
