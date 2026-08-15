import { createFileRoute } from "@tanstack/react-router";

import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { applySuccessfulPayment } from "@/lib/payments.server";

function factsFromPaymentIntent(pi: {
  id: string;
  metadata?: { booking_id?: string; payment_mode?: string };
  latest_charge?: string | { id?: string } | null;
  amount_received?: number;
  amount?: number;
}) {
  const bookingId = pi?.metadata?.booking_id;
  if (!bookingId) return null;
  const mode = pi?.metadata?.payment_mode;
  const charge =
    pi?.latest_charge && typeof pi.latest_charge === "string"
      ? pi.latest_charge
      : (pi?.latest_charge?.id ?? null);
  return {
    bookingId,
    paymentMode: (mode === "full" || mode === "balance" ? mode : "deposit") as
      | "deposit"
      | "full"
      | "balance",
    paymentIntentId: pi.id,
    chargeId: charge,
    amountCents: Number(pi.amount_received ?? pi.amount ?? 0),
  };
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "payment_intent.succeeded": {
      const facts = factsFromPaymentIntent(event.data.object);
      if (facts) await applySuccessfulPayment(facts);
      break;
    }
    case "checkout.session.completed": {
      const session = event.data.object as {
        payment_status?: string;
        metadata?: { booking_id?: string; payment_mode?: string };
        payment_intent?: string | { id?: string };
        amount_total?: number;
        id: string;
      };
      if (session.payment_status === "unpaid") break;
      const bookingId = session?.metadata?.booking_id;
      if (!bookingId) break;
      const mode = session?.metadata?.payment_mode;
      await applySuccessfulPayment({
        bookingId,
        paymentMode: mode === "full" || mode === "balance" ? mode : "deposit",
        paymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? session.id),
        chargeId: null,
        amountCents: Number(session.amount_total ?? 0),
      });
      break;
    }
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
