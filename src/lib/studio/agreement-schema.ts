import { z } from "zod";

import { studioBookingDetailsSchema } from "./booking-schema";

export const finalizeStudioSignatureSchema = z.object({
  booking: studioBookingDetailsSchema,
  signerName: z.string().trim().min(2, { message: "Type your full legal name" }).max(120),
  signatureValue: z
    .string()
    .startsWith("data:image/png;base64,", { message: "Draw your signature" })
    .max(500_000),
  consent: z.literal(true, { message: "You must agree before signing" }),
  marketingOptIn: z.boolean(),
});

export type FinalizeStudioSignatureInput = z.infer<typeof finalizeStudioSignatureSchema>;
