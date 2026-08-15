import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  bookingId: z.string().uuid(),
  paymentMode: z.enum(["deposit", "full"]),
  environment: z.enum(["sandbox", "live"]),
  returnUrl: z.string().url(),
});

export type CreateBookingPaymentResult = { clientSecret: string } | { error: string };

/** Runtime publishable key — Vite only inlines `VITE_*` at build time. */
export const getPaymentsBrowserConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { getStripePublishableKey } = await import("./stripe.server");
  return { publishableKey: getStripePublishableKey() ?? "" };
});

/**
 * Creates the checkout session for the server-computed amount. Amounts are
 * read from the booking row — never from the browser — and payment is
 * refused until the agreement is signed.
 */
export const createBookingPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<CreateBookingPaymentResult> => {
    const { startBookingPayment } = await import("./payments.server");
    return startBookingPayment(data);
  });

export const getBookingPaymentStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ bookingId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { readBookingPaymentStatus } = await import("./payments.server");
    return readBookingPaymentStatus(data.bookingId);
  });
