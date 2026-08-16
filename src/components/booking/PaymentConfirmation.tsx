import { useEffect, useState } from "react";

import { EXPERIENCES, type ExperienceKey } from "@/config/pricing";
import { getBookingPaymentStatus } from "@/lib/payments.functions";
import { EXPERIENCE_IMAGES } from "./StepExperience";
import { formatLongDate } from "./StepPayment";
import { ConfirmationGrouped, type ConfirmationModel } from "./confirmation-layouts";

type Status = Awaited<ReturnType<typeof getBookingPaymentStatus>>;

const PREVIEW_CONTACT = {
  client_name: "Camila Reyes",
  client_email: "camila.reyes@email.com",
  client_phone: "3055550147",
  event_location: "Studio 7 Miami — 638 NW 62nd St, Miami, FL",
} as const;

const PREVIEW_DEPOSIT: NonNullable<Status> = {
  status: "confirmed",
  payment_mode: "deposit",
  amount_paid_cents: 12500,
  balance_cents: 12500,
  balance_due_date: "2026-08-23",
  balance_link: null,
  paid_at: "2026-08-15T20:40:00.000-04:00",
  total_cents: 25000,
  experience: "classic",
  event_date: "2026-08-30",
  event_start_time: "21:00",
  ...PREVIEW_CONTACT,
};

const PREVIEW_BOOKED: NonNullable<Status> = {
  status: "confirmed",
  payment_mode: "full",
  amount_paid_cents: 25000,
  balance_cents: 0,
  balance_due_date: null,
  balance_link: null,
  paid_at: "2026-08-15T20:40:00.000-04:00",
  total_cents: 25000,
  experience: "classic",
  event_date: "2026-08-22",
  event_start_time: "21:00",
  ...PREVIEW_CONTACT,
};

const CONFIRMED: ReadonlySet<string> = new Set([
  "deposit_paid",
  "paid_in_full",
  "confirmed",
  "settled",
  "completed",
]);

function modelFromStatus(status: NonNullable<Status>, settled: boolean): ConfirmationModel {
  const experienceKey =
    status.experience && status.experience in EXPERIENCES
      ? (status.experience as ExperienceKey)
      : null;
  return {
    settled,
    experienceName: experienceKey ? EXPERIENCES[experienceKey].name : null,
    ...(experienceKey ? { imageUrl: EXPERIENCE_IMAGES[experienceKey].url } : {}),
    ...(status.event_date ? { eventDate: status.event_date } : {}),
    ...(status.event_start_time ? { eventStartTime: status.event_start_time } : {}),
    totalCents: status.total_cents ?? status.amount_paid_cents ?? 0,
    paidOn: status.paid_at
      ? new Intl.DateTimeFormat("en-US", {
          dateStyle: "long",
          timeZone: "America/New_York",
        }).format(new Date(status.paid_at))
      : null,
    isDeposit:
      status.payment_mode === "deposit" &&
      status.status !== "settled" &&
      status.status !== "completed" &&
      status.status !== "paid_in_full",
    balanceCents: status.balance_cents,
    dueLabel: status.balance_due_date ? formatLongDate(status.balance_due_date) : null,
    ...(status.client_name ? { clientName: status.client_name } : {}),
    ...(status.client_email ? { clientEmail: status.client_email } : {}),
    ...(status.client_phone ? { clientPhone: status.client_phone } : {}),
    ...(status.event_location ? { eventLocation: status.event_location } : {}),
  };
}

/**
 * Payment truth comes from the webhook (or a Stripe fallback on poll),
 * so we wait for the server rather than trusting the browser redirect.
 */
export function PaymentConfirmation({
  bookingId,
  preview = false,
}: {
  bookingId: string;
  preview?: boolean | "deposit";
}) {
  const [status, setStatus] = useState<Status>(
    preview === "deposit" ? PREVIEW_DEPOSIT : preview ? PREVIEW_BOOKED : null,
  );
  const [settled, setSettled] = useState(Boolean(preview));

  useEffect(() => {
    if (preview) return;
    let active = true;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      try {
        const next = await getBookingPaymentStatus({ data: { bookingId } });
        if (!active) return;
        setStatus(next);
        const done = Boolean(next?.status && CONFIRMED.has(next.status));
        if (done || attempts >= 20) {
          setSettled(done);
          return;
        }
      } catch {
        if (attempts >= 20) return;
      }
      if (active) setTimeout(poll, 2000);
    };

    void poll();
    return () => {
      active = false;
    };
  }, [bookingId, preview]);

  const model = status
    ? modelFromStatus(status, settled)
    : {
        settled: false,
        experienceName: null,
        totalCents: 0,
        paidOn: null,
        isDeposit: false,
        balanceCents: null,
        dueLabel: null,
      };

  return (
    <div className="flex min-h-svh w-full justify-center overflow-y-auto px-5 py-6">
      <div className="my-auto w-full max-w-xl">
        <ConfirmationGrouped model={model} />
      </div>
    </div>
  );
}
