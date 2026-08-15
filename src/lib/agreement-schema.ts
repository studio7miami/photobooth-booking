import { z } from "zod";

import { bookingDetailsSchema } from "./booking-schema";

export const finalizeSignatureSchema = z.object({
  booking: bookingDetailsSchema,
  signerName: z.string().trim().min(2, { message: "Type your full legal name" }).max(120),
  /** PNG data URL of the drawn signature. */
  signatureValue: z
    .string()
    .startsWith("data:image/png;base64,", { message: "Draw your signature" })
    .max(500_000),
  consent: z.literal(true, { message: "You must agree before signing" }),
  marketingOptIn: z.boolean(),
});

export type FinalizeSignatureInput = z.infer<typeof finalizeSignatureSchema>;
