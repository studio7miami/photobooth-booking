import { formatCents } from "@/config/pricing";
import { canStartPayment, type BookingStatus } from "./booking-states";
import { getAdmin, logBookingEvent, transitionBooking } from "./booking.server";
import { isHoldActive } from "./hold";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "./stripe.server";

type StartArgs = {
  bookingId: string;
  paymentMode: "deposit" | "full";
  environment: StripeEnv;
  returnUrl: string;
};

/**
 * Human-readable catalog price IDs (lookup keys) for each experience tier.
 * Charges stay dynamic — hours and station count move the amount — but every
 * charge is attached to the matching catalog product so the payments
 * dashboard reports real package names and the right tax classification.
 */
const CATALOG_LOOKUP_KEY: Record<string, string> = {
  classic: "miami_classic_base",
  social: "miami_social_base",
  luxe: "miami_luxe_base",
};

async function resolveCatalogProductId(
  stripe: ReturnType<typeof createStripeClient>,
  experience: string | null | undefined,
): Promise<string | null> {
  const lookupKey = experience ? CATALOG_LOOKUP_KEY[experience] : undefined;
  if (!lookupKey) return null;
  try {
    const prices = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
    const price = prices.data[0];
    if (!price) return null;
    return typeof price.product === "string" ? price.product : price.product.id;
  } catch {
    // A missing catalog entry must never block a payment.
    return null;
  }
}

async function resolveCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  args: { email: string; name: string; bookingId: string; existingId?: string | null },
): Promise<string> {
  if (args.existingId) return args.existingId;
  const existing = await stripe.customers.list({ email: args.email, limit: 1 });
  const found = existing.data[0];
  if (found) return found.id;
  // No card is saved and no off-session setup is created for this customer.
  const created = await stripe.customers.create({
    email: args.email,
    name: args.name,
    metadata: { booking_id: args.bookingId },
  });
  return created.id;
}

async function createBalancePaymentLink(args: {
  stripe: ReturnType<typeof createStripeClient>;
  bookingId: string;
  balanceCents: number;
  catalogProductId: string | null;
}): Promise<void> {
  const price = await args.stripe.prices.create(
    {
      currency: "usd",
      unit_amount: args.balanceCents,
      ...(args.catalogProductId
        ? { product: args.catalogProductId }
        : {
            product_data: {
              name: `Studio 7 Miami remaining balance — ${formatCents(args.balanceCents)}`,
            },
          }),
      metadata: { booking_id: args.bookingId },
    },
    { idempotencyKey: `booking-${args.bookingId}-balance-price` },
  );
  const link = await args.stripe.paymentLinks.create(
    {
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { booking_id: args.bookingId, payment_mode: "balance" },
      payment_intent_data: {
        metadata: { booking_id: args.bookingId, payment_mode: "balance" },
      },
    },
    { idempotencyKey: `booking-${args.bookingId}-balance-link` },
  );
  const supabase = await getAdmin();
  await supabase
    .from("bookings")
    .update({
      balance_link: link.url,
      balance_status: "pending",
    } as never)
    .eq("id", args.bookingId);
}

export async function startBookingPayment(args: StartArgs): Promise<
  { clientSecret: string } | { error: string }
> {
  const supabase = await getAdmin();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", args.bookingId)
    .maybeSingle();

  if (error || !booking) return { error: "Booking not found." };
  const row = booking as Record<string, any>;

  if (!canStartPayment(row["status"] as BookingStatus)) {
    return { error: "Payment unlocks once the agreement is signed." };
  }

  if (!isHoldActive(row["signed_at"] as string | null)) {
    await transitionBooking({
      bookingId: args.bookingId,
      from: "agreement_signed",
      to: "expired",
      actor: "system",
      meta: { reason: "hold_expired" },
    });
    return { error: "Your 10-minute hold ended. Go back and sign again to reserve this time." };
  }

  const totalCents = Number(row["total_cents"] ?? 0);
  const depositCents = Number(row["deposit_cents"] ?? 0);
  const balanceCents = Number(row["balance_cents"] ?? 0);

  // Events inside 7 days leave no window to collect a balance — full payment only.
  const eventDate = row["event_date"] ? String(row["event_date"]) : null;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(
    new Date(),
  );
  const daysOut = eventDate
    ? Math.round(
        (Date.parse(`${eventDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000,
      )
    : Number.POSITIVE_INFINITY;
  const paymentMode: "deposit" | "full" = daysOut <= 7 ? "full" : args.paymentMode;

  const amountCents = paymentMode === "deposit" ? depositCents : totalCents;
  if (!amountCents || amountCents < 50) return { error: "This booking has no payable amount." };


  try {
    const stripe = createStripeClient(args.environment);

    const [customerId, catalogProductId] = await Promise.all([
      resolveCustomer(stripe, {
        email: String(row["client_email"]),
        name: String(row["client_name"]),
        bookingId: args.bookingId,
        existingId: row["stripe_customer_id"],
      }),
      resolveCatalogProductId(stripe, row["experience"]),
    ]);

    const label =
      paymentMode === "deposit"
        ? `Studio 7 Miami deposit (50%) — ${formatCents(amountCents)}`
        : `Studio 7 Miami booking paid in full — ${formatCents(amountCents)}`;

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        // Custom Checkout: we own the pay-sheet chrome; Stripe still renders
        // Link, wallets, cards, and every other Dashboard-enabled method.
        ui_mode: "elements",
        return_url: args.returnUrl,
        customer: customerId,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: amountCents,
              // Attach to the catalog product when it exists so reporting and
              // tax classification follow the package, not a one-off line item.
              ...(catalogProductId
                ? { product: catalogProductId }
                : { product_data: { name: label } }),
            },
          },
        ],
        payment_intent_data: {
          description: label,
          // Deliberately no setup_future_usage — the card is not saved.
          metadata: {
            booking_id: args.bookingId,
            payment_mode: paymentMode,
          },
        },
        metadata: { booking_id: args.bookingId, payment_mode: paymentMode },
      },
      { idempotencyKey: `booking-${args.bookingId}-${paymentMode}-elements` },
    );

    const clientSecret = session.client_secret ?? "";

    // Don't hold the pay sheet for bookkeeping — customer id and the
    // balance link can land after Stripe already has a client secret.
    void supabase
      .from("bookings")
      .update({
        stripe_customer_id: customerId,
        payment_mode: paymentMode,
      } as never)
      .eq("id", args.bookingId);

    if (paymentMode === "deposit" && balanceCents >= 50 && !row["balance_link"]) {
      void createBalancePaymentLink({
        stripe,
        bookingId: args.bookingId,
        balanceCents,
        catalogProductId,
      }).catch((err) => {
        console.error("[payments] balance link failed", err);
      });
    }

    return { clientSecret };
  } catch (err) {
    return { error: getStripeErrorMessage(err) };
  }
}

export type PaymentFacts = {
  bookingId: string;
  paymentMode: "deposit" | "full" | "balance";
  paymentIntentId: string;
  chargeId: string | null;
  amountCents: number;
};

/** Payment truth is set here only — never from the browser. */
export async function applySuccessfulPayment(facts: PaymentFacts) {
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
    return;
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

function stripeEnvFromSecret(): StripeEnv {
  const key = process.env["STRIPE_SECRET_KEY"]?.trim() ?? "";
  return key.startsWith("sk_live_") ? "live" : "sandbox";
}

/** If the webhook hasn't landed yet, confirm from Stripe so test checkout still settles. */
async function recoverPaidCheckout(bookingId: string, customerId: string | null) {
  if (!customerId) return;
  try {
    const stripe = createStripeClient(stripeEnvFromSecret());
    const intents = await stripe.paymentIntents.list({ customer: customerId, limit: 15 });
    const paid = intents.data.find(
      (intent) => intent.metadata?.booking_id === bookingId && intent.status === "succeeded",
    );
    if (!paid) return;
    const mode = paid.metadata?.payment_mode;
    await applySuccessfulPayment({
      bookingId,
      paymentMode: mode === "full" || mode === "balance" ? mode : "deposit",
      paymentIntentId: paid.id,
      chargeId: typeof paid.latest_charge === "string" ? paid.latest_charge : paid.latest_charge?.id ?? null,
      amountCents: Number(paid.amount_received ?? paid.amount ?? 0),
    });
  } catch (error) {
    console.error("[payments] Stripe recovery failed", error);
  }
}

export async function readBookingPaymentStatus(bookingId: string) {
  const supabase = await getAdmin();
  const { data } = await supabase
    .from("bookings")
    .select(
      "status, payment_mode, amount_paid_cents, balance_cents, balance_due_date, balance_link, paid_at, total_cents, experience, event_date, event_start_time, stripe_customer_id",
    )
    .eq("id", bookingId)
    .maybeSingle();

  const row = (data ?? null) as null | {
    status: BookingStatus;
    payment_mode: string | null;
    amount_paid_cents: number;
    balance_cents: number | null;
    balance_due_date: string | null;
    balance_link: string | null;
    paid_at: string | null;
    total_cents: number | null;
    experience: string | null;
    event_date: string | null;
    event_start_time: string | null;
    stripe_customer_id: string | null;
  };

  if (row?.status === "agreement_signed") {
    await recoverPaidCheckout(bookingId, row.stripe_customer_id);
    const { data: again } = await supabase
      .from("bookings")
      .select(
        "status, payment_mode, amount_paid_cents, balance_cents, balance_due_date, balance_link, paid_at, total_cents, experience, event_date, event_start_time",
      )
      .eq("id", bookingId)
      .maybeSingle();
    return (again ?? null) as null | {
      status: BookingStatus;
      payment_mode: string | null;
      amount_paid_cents: number;
      balance_cents: number | null;
      balance_due_date: string | null;
      balance_link: string | null;
      paid_at: string | null;
      total_cents: number | null;
      experience: string | null;
      event_date: string | null;
      event_start_time: string | null;
    };
  }

  if (!row) return null;
  const { stripe_customer_id: _ignored, ...rest } = row;
  return rest;
}
