import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { EXPERIENCES, formatCents, type ExperienceKey } from "@/config/pricing";
import { getBookingPaymentStatus } from "@/lib/payments.functions";
import {
  EdCaption,
  EdCard,
  EdSpec,
  EdSpecs,
} from "./EditorialCard";
import { OrderLine, formatLongDate } from "./StepPayment";

type Status = Awaited<ReturnType<typeof getBookingPaymentStatus>>;

/**
 * Payment truth comes from the webhook, so we poll the booking until the
 * server confirms it rather than trusting the browser's redirect. Same card
 * anatomy as Step 5 — just its "done" state.
 */
export function PaymentConfirmation({ bookingId }: { bookingId: string }) {
  const [status, setStatus] = useState<Status>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let active = true;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      try {
        const next = await getBookingPaymentStatus({ data: { bookingId } });
        if (!active) return;
        setStatus(next);
        const done =
          next?.status === "confirmed" ||
          next?.status === "settled" ||
          next?.status === "completed";
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
  }, [bookingId]);

  const paidCents = status?.amount_paid_cents ?? 0;
  const totalCents = status?.total_cents ?? paidCents;
  const isDeposit = status?.payment_mode === "deposit";
  const dueLabel = status?.balance_due_date ? formatLongDate(status.balance_due_date) : null;
  const experienceName =
    status?.experience && status.experience in EXPERIENCES
      ? EXPERIENCES[status.experience as ExperienceKey].name
      : null;

  return (
    <EdCard>
      <span className="flex size-10 items-center justify-center rounded-full bg-foreground">
        {settled ? (
          <Check className="size-5 text-background" aria-hidden="true" />
        ) : (
          <Loader2 className="size-5 animate-spin text-background" aria-hidden="true" />
        )}
      </span>
      <h2 className="mt-5 font-display text-2xl">
        {settled ? "You're booked" : "Confirming your payment"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {settled
          ? "Payment received and your booking is confirmed. A confirmation email is on its way."
          : "We're waiting for the payment confirmation from our processor. This usually takes a few seconds."}
      </p>

      <div className="mt-8 border-t border-border pt-6">
        <OrderLine
          {...(experienceName ? { experienceName } : {})}
          {...(status?.event_date ? { eventDate: status.event_date } : {})}
          {...(status?.event_start_time ? { eventStartTime: status.event_start_time } : {})}
          totalCents={totalCents}
          done
        />
      </div>

      {status ? (
        <>
          <p className="label-caps mt-8 text-[10px] text-muted-foreground">Payment summary</p>
          <EdSpecs className="mt-2">
            <EdSpec label="Booking status" value={status.status.replace(/_/g, " ")} />
            {paidCents > 0 ? (
              <EdSpec label="Amount paid" value={formatCents(paidCents)} strong />
            ) : null}
            {isDeposit && status.balance_cents ? (
              <EdSpec label="Balance remaining" value={formatCents(status.balance_cents)} strong />
            ) : null}
            {isDeposit && dueLabel ? <EdSpec label="Balance due date" value={dueLabel} /> : null}
          </EdSpecs>
        </>
      ) : null}

      {settled && isDeposit && status?.balance_link ? (
        <div className="mt-8">
          <a
            href={status.balance_link}
            target="_blank"
            rel="noopener noreferrer"
            className="ed-pill block w-full px-6 py-3.5 text-center text-[11px] transition-opacity hover:opacity-90"
          >
            Pay remaining balance
          </a>
          <EdCaption>Secure checkout · your card is never stored</EdCaption>
        </div>
      ) : null}
    </EdCard>
  );
}
