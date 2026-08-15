import { createFileRoute } from "@tanstack/react-router";

import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import type { BookingStatus } from "@/lib/booking-states";
import { getAdmin, logBookingEvent, transitionBooking } from "@/lib/booking.server";

type PaymentFacts = {
  bookingId: string;
  paymentMode: "deposit" | "full" | "balance";
  paymentIntentId: string;
  chargeId: string | null;
  amountCents: number;
};

/** Payment truth is set here only — never from the browser. */
async function applyPayment(facts: PaymentFacts) {
  const supabase = await getAdmin();
  const { data } = await supabase
    .from("bookings")
    .select("id, status, amount_paid_cents, stripe_payment_intent_id, balance_payment_intent_id")
    .eq("id", facts.bookingId)
    .maybeSingle();

  if (!data) {
    console.error("Webhook for unknown booking", facts.bookingId);
    return;
  }
  const row = data as Record<string, any>;
  const status = row["status"] as BookingStatus;

  if (facts.paymentMode === "balance") {
    // Idempotent: the same intent applied twice is a no-op.
    if (row["balance_payment_intent_id"] === facts.paymentIntentId) return;
    const from: BookingStatus = status === "balance_due" ? "balance_due" : "confirmed";
    if (from !== status) return;
    await transitionBooking({
      bookingId: facts.bookingId,
      from,
      to: "settled",
      actor: "stripe_webhook",
      patch: {
        balance_payment_intent_id: facts.paymentIntentId,
        balance_status: "paid",
        amount_paid_cents: Number(row["amount_paid_cents"] ?? 0) + facts.amountCents,
        paid_at: new Date().toISOString(),
      },
      meta: { payment_intent_id: facts.paymentIntentId, amount_cents: facts.amountCents },
    });
    return;
  }

  if (row["stripe_payment_intent_id"] === facts.paymentIntentId && status !== "agreement_signed") {
    return; // already applied
  }
  if (status !== "agreement_signed") {
    await logBookingEvent({
      bookingId: facts.bookingId,
      from: status,
      to: status,
      actor: "stripe_webhook",
      meta: { ignored: "payment received in non-payable state", payment_intent_id: facts.paymentIntentId },
    });
    return;
  }

  const paidState: BookingStatus = facts.paymentMode === "deposit" ? "deposit_paid" : "paid_in_full";

  const moved = await transitionBooking({
    bookingId: facts.bookingId,
    from: "agreement_signed",
    to: paidState,
    actor: "stripe_webhook",
    patch: {
      stripe_payment_intent_id: facts.paymentIntentId,
      stripe_charge_id: facts.chargeId,
      amount_paid_cents: facts.amountCents,
      paid_at: new Date().toISOString(),
      payment_mode: facts.paymentMode,
      ...(facts.paymentMode === "deposit"
        ? { balance_status: "pending" }
        : { balance_status: "paid", balance_cents: 0 }),
    },
    meta: { payment_intent_id: facts.paymentIntentId, amount_cents: facts.amountCents },
  });

  if (!moved) return;

  await transitionBooking({
    bookingId: facts.bookingId,
    from: paidState,
    to: "confirmed",
    actor: "stripe_webhook",
    meta: { payment_mode: facts.paymentMode },
  });
}

function factsFromPaymentIntent(pi: any): PaymentFacts | null {
  const bookingId = pi?.metadata?.booking_id;
  if (!bookingId) return null;
  const mode = pi?.metadata?.payment_mode;
  const charge =
    pi?.latest_charge && typeof pi.latest_charge === "string"
      ? pi.latest_charge
      : (pi?.latest_charge?.id ?? null);
  return {
    bookingId,
    paymentMode: mode === "full" || mode === "balance" ? mode : "deposit",
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
      if (facts) await applyPayment(facts);
      break;
    }
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.payment_status === "unpaid") break;
      const bookingId = session?.metadata?.booking_id;
      if (!bookingId) break;
      const mode = session?.metadata?.payment_mode;
      await applyPayment({
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
