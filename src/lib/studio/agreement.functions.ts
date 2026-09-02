import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { STUDIO_LOCATION } from "@/config/studio/booking-rules";
import { errorMessage } from "@/lib/error-message";
import { finalizeStudioSignatureSchema, createStudioClassHoldSchema } from "./agreement-schema";
import { finalizeStudioSignatureRecord } from "./agreement.server";

export const finalizeStudioSignature = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => finalizeStudioSignatureSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const request = getRequest();
      const vars = {
        offering: data.booking.offering,
        durationMinutes: data.booking.durationMinutes,
        clientName: data.booking.clientName,
        clientPhone: data.booking.clientPhone,
        clientEmail: data.booking.clientEmail,
        eventLocation: data.booking.eventLocation || STUDIO_LOCATION,
        eventDate: data.booking.eventDate,
        eventStartTime: data.booking.eventStartTime,
        clientNotes: data.booking.clientNotes,
        classSessionId: data.booking.classSessionId,
      };
      const record = await finalizeStudioSignatureRecord({
        vars,
        signatureValue: data.signatureValue,
        signerName: data.signerName,
        marketingOptIn: data.marketingOptIn,
        headers: request.headers,
      });

      const { persistStudioSignedBooking } = await import("./agreement-persist.server");
      const bookingId = await persistStudioSignedBooking(data.booking, record);

      return { ...record, booking_id: bookingId };
    } catch (error) {
      throw new Error(errorMessage(error, "We couldn't record your signature. Please try again."));
    }
  });

export const createStudioClassHold = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createStudioClassHoldSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const { persistStudioClassHold } = await import("./agreement-persist.server");
      return persistStudioClassHold(data.booking);
    } catch (error) {
      throw new Error(errorMessage(error, "We couldn't hold this seat. Please try again."));
    }
  });
