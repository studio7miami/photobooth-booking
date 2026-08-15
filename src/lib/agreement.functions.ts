import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { finalizeSignatureSchema } from "./agreement-schema";
import { finalizeSignatureRecord } from "./agreement.server";

export const finalizeSignature = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => finalizeSignatureSchema.parse(data))
  .handler(async ({ data }) => {
    const request = getRequest();
    const record = await finalizeSignatureRecord({
      vars: data.booking,
      signatureValue: data.signatureValue,
      signerName: data.signerName,
      marketingOptIn: data.marketingOptIn,
      headers: request.headers,
    });

    const { persistSignedBooking } = await import("./agreement-persist.server");
    const bookingId = await persistSignedBooking(data.booking, record);

    return { ...record, booking_id: bookingId };
  });
