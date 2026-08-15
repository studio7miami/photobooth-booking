import { z } from "zod";
import { EVENT_TYPES, EXPERIENCE_KEYS } from "@/config/pricing";

const eventTypeValues = EVENT_TYPES.map((t) => t.value) as [string, ...string[]];

export const stepExperienceSchema = z.object({
  experience: z.enum(EXPERIENCE_KEYS),
});

export const stepTimeSchema = z
  .object({
    eventDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Choose your event date" })
      .refine((d) => d > new Date().toISOString().slice(0, 10), {
        message: "Pick a future date",
      }),
    eventStartTime: z.string().regex(/^\d{2}:\d{2}$/, { message: "Choose a start time" }),
    durationHours: z.number().int().min(1).max(24),
    stationCount: z.number().int().min(1).max(10).nullable().optional(),
  })
  .strict();

export const stepDetailsSchema = z.object({
  clientName: z.string().trim().min(2, { message: "Enter your full name" }).max(120),
  clientPhone: z
    .string()
    .trim()
    .min(7, { message: "Enter a reachable phone number" })
    .max(32)
    .regex(/^[0-9+()\-.\s]+$/, { message: "Numbers only, please" }),
  clientEmail: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  eventLocation: z.string().trim().min(4, { message: "Where is the event?" }).max(240),
  eventType: z.enum(eventTypeValues, { message: "Choose an event type" }),
  eventTypeOther: z.string().trim().max(120).optional(),
}).superRefine((v, ctx) => {
  if (v.eventType === "other" && !v.eventTypeOther?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["eventTypeOther"],
      message: "Tell us what kind of event this is",
    });
  }
});

export const bookingDetailsSchema = stepExperienceSchema
  .extend(stepTimeSchema.shape)
  .extend({
    clientName: z.string().trim().min(2).max(120),
    clientPhone: z.string().trim().min(7).max(32),
    clientEmail: z.string().trim().email().max(255),
    eventLocation: z.string().trim().min(4).max(240),
    eventType: z.enum(eventTypeValues),
    eventTypeOther: z.string().trim().max(120).optional(),
  });

export type BookingDetails = z.infer<typeof bookingDetailsSchema>;

/** Partial shape held while the client is still moving through the flow. */
export type BookingDraft = { [K in keyof BookingDetails]?: BookingDetails[K] | undefined };

export const TOTAL_STEPS = 5;

export const STEP_META = [
  { step: 1, label: "Experience", microcopy: "Let's start with the vibe." },
  { step: 2, label: "Date & time", microcopy: "Nice choice. When is it happening?" },
  { step: 3, label: "Event details", microcopy: "Almost there — just the essentials." },
  { step: 4, label: "Review & sign", microcopy: "You're one signature from booked." },
  { step: 5, label: "Payment", microcopy: "Last step. Then it's official." },
] as const;
