import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { BalancePayScreen, offeringDisplay } from "@/components/booking/BalancePayScreen";
import { PaymentConfirmation } from "@/components/booking/PaymentConfirmation";
import { canStartBalancePayment } from "@/lib/booking-states";
import { getBookingPaymentStatus } from "@/lib/payments.functions";

type Status = Awaited<ReturnType<typeof getBookingPaymentStatus>>;

export const Route = createFileRoute("/pay/$bookingId")({
  validateSearch: (search: Record<string, unknown>) => ({
    paid: typeof search.paid === "string" ? search.paid : undefined,
  }),
  head: () => ({
    meta: [{ title: "Pay remaining — Studio 7 Miami" }],
  }),
  component: PayBooking,
});

function PayBooking() {
  const { bookingId } = Route.useParams();
  const { paid } = Route.useSearch();
  const [status, setStatus] = useState<Status | undefined>(undefined);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let active = true;
    void getBookingPaymentStatus({ data: { bookingId } })
      .then((next) => {
        if (!active) return;
        if (!next) setMissing(true);
        else setStatus(next);
      })
      .catch(() => {
        if (active) setMissing(true);
      });
    return () => {
      active = false;
    };
  }, [bookingId]);

  if (missing) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <p className="max-w-md text-center text-sm text-muted-foreground">
          We couldn't find this booking. If the link came from an email, write us and we'll send a
          fresh one.
        </p>
      </div>
    );
  }

  if (!status) {
    return <div className="min-h-svh bg-background" />;
  }

  const remaining = Number(status.balance_cents ?? 0);
  const settled =
    remaining < 50 ||
    status.balance_status === "paid" ||
    status.status === "settled" ||
    status.status === "completed" ||
    status.status === "paid_in_full";

  if (paid || settled) {
    return <PaymentConfirmation bookingId={bookingId} />;
  }

  if (!canStartBalancePayment(status.status) || remaining < 50) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <p className="max-w-md text-center text-sm text-muted-foreground">
          This booking isn't open for a remaining payment.
        </p>
      </div>
    );
  }

  const display = offeringDisplay(status.experience);

  return (
    <BalancePayScreen
      bookingId={bookingId}
      experienceName={display.experienceName}
      {...(display.imageUrl ? { imageUrl: display.imageUrl } : {})}
      {...(status.event_date ? { eventDate: status.event_date } : {})}
      {...(status.event_start_time ? { eventStartTime: status.event_start_time } : {})}
      {...(status.event_location ? { eventLocation: status.event_location } : {})}
      totalCents={status.total_cents ?? remaining * 2}
      balanceCents={remaining}
      {...(status.balance_due_date ? { balanceDueDate: status.balance_due_date } : {})}
      kind={display.kind}
      {...(display.experienceKey ? { experienceKey: display.experienceKey } : {})}
      {...(display.offeringKey ? { offeringKey: display.offeringKey } : {})}
    />
  );
}
