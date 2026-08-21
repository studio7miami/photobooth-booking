import { createFileRoute } from "@tanstack/react-router";

import { paymentsWebhookResponse } from "@/lib/payments-webhook";

/** Compatibility alias for the pre-cutover Stripe webhook URL. */
export const Route = createFileRoute("/photobooth/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => paymentsWebhookResponse(request),
    },
  },
});
