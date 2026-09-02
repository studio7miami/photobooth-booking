import { z } from "zod";

import { bookingDetailsSchema } from "./booking-schema";

export const finalizeSignatureSchema = z.object({
  booking: bookingDetailsSchema,
  signerName: z.string().trim().min(2, { message: "Type your full legal name" }).max(120),
  /** Drawn signature as a JPEG (or PNG) data URL. */
  signatureValue: z
    .string()
    .regex(/^data:image\/(png|jpeg);base64,/, { message: "Draw your signature" })
    .max(2_000_000),
  consent: z.literal(true, { message: "You must agree before signing" }),
  marketingOptIn: z.boolean(),
});

export type FinalizeSignatureInput = z.infer<typeof finalizeSignatureSchema>;
