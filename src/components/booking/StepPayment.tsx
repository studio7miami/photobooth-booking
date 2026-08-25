import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check } from "lucide-react";

import { formatCents, REQUIRE_FULL_PAYMENT_WITHIN_DAYS } from "@/config/pricing";
import { getStripe } from "@/lib/stripe";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { offeringImageFocusClass } from "@/components/studio/StepOffering";
import { cn } from "@/lib/utils";
import { EdCaption, EdCard, EdPrimaryButton, EdSpec, EdSpecs } from "./EditorialCard";
import { PayCheckoutSheet } from "./PayCheckoutSheet";
import { formatTime } from "./StepTime";

export type PaymentMode = "deposit" | "full";

type Props = {
  bookingId: string;
  totalCents: number;
  depositCents: number;
  balanceCents: number;
  balanceDueDate: string;
  experienceName?: string | undefined;
  eventDate?: string | undefined;
  eventStartTime?: string | undefined;
  imageUrl?: string | undefined;
  depositEligible?: boolean | undefined;
};

export function formatLongDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "America/New_York",
  }).format(new Date(`${date}T12:00:00Z`));
}

function todayEastern(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

function daysUntil(date: string): number {
  const a = Date.parse(`${todayEastern()}T00:00:00Z`);
  const b = Date.parse(`${date}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

export function StepPayment({
  bookingId,
  totalCents,
  depositCents,
  balanceCents,
  balanceDueDate,
  experienceName,
  eventDate,
  eventStartTime,
  imageUrl,
  depositEligible = true,
}: Props) {
  const requiresFull =
    !depositEligible ||
    (eventDate ? daysUntil(eventDate) <= REQUIRE_FULL_PAYMENT_WITHIN_DAYS : false);
  const [mode, setMode] = useState<PaymentMode>(requiresFull ? "full" : "deposit");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const payButtonRef = useRef<HTMLButtonElement>(null);

  const effectiveMode: PaymentMode = requiresFull ? "full" : mode;
  const payFull = effectiveMode === "full";
  const dueLabel = useMemo(
    () => formatLongDate(payFull ? todayEastern() : balanceDueDate),
    [balanceDueDate, payFull],
  );
  const chargeCents = payFull ? totalCents : depositCents;

  useEffect(() => {
    if (effectiveMode) void getStripe();
  }, [effectiveMode]);

  const selectMode = (next: PaymentMode) => {
    if (next === effectiveMode) return;
    setMode(next);
  };

  return (
    <div className="space-y-6">
      <PaymentTestModeBanner />

      <EdCard>
        <OrderLine
          experienceName={experienceName}
          eventDate={eventDate}
          eventStartTime={eventStartTime}
          imageUrl={imageUrl}
          totalCents={totalCents}
        />

        <p className="label-caps mt-8 text-[10px] text-muted-foreground">Payment summary</p>
        <EdSpecs className="mt-2">
          <EdSpec label="Total" value={formatCents(totalCents)} strong={payFull} />
          {payFull ? null : (
            <>
              <EdSpec label="Deposit (50%)" value={formatCents(depositCents)} strong />
              <EdSpec label="Balance (50%)" value={formatCents(balanceCents)} />
            </>
          )}
          <EdSpec label={payFull ? "Due" : "Balance due date"} value={dueLabel} />
        </EdSpecs>

        {requiresFull ? (
          <p className="mt-6 text-sm text-muted-foreground">
            {!depositEligible
              ? "This session is paid in full today."
              : `Your date is within ${REQUIRE_FULL_PAYMENT_WITHIN_DAYS} days, so this booking is paid in full today.`}
          </p>
        ) : (
          <div
            className="mt-8 grid gap-4 sm:grid-cols-2"
            role="radiogroup"
            aria-label="Payment option"
          >
            <OptionCard
              selected={!payFull}
              onSelect={() => selectMode("deposit")}
              title="Pay deposit"
              detail={`${formatCents(depositCents)} now · ${formatCents(balanceCents)} due ${formatLongDate(balanceDueDate)}`}
            />
            <OptionCard
              selected={payFull}
              onSelect={() => selectMode("full")}
              title="Pay in full"
              detail={`${formatCents(totalCents)} now`}
            />
          </div>
        )}

        <div className="mt-8">
          <EdPrimaryButton ref={payButtonRef} onClick={() => setCheckoutOpen(true)}>
            {payFull ? "Pay in full" : "Pay deposit"} · {formatCents(chargeCents)}
          </EdPrimaryButton>
          <EdCaption>
            Secure checkout · your card is never stored
            {payFull ? "" : " · Remaining balance can be paid from your confirmation."}
          </EdCaption>
        </div>
      </EdCard>

      <PayCheckoutSheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        bookingId={bookingId}
        paymentMode={effectiveMode}
        chargeCents={chargeCents}
        experienceName={experienceName}
        eventDate={eventDate}
        eventStartTime={eventStartTime}
        {...(!payFull
          ? { dueNote: `Balance ${formatCents(balanceCents)} · ${formatLongDate(balanceDueDate)}` }
          : {})}
      />
    </div>
  );
}

export function OrderLine({
  experienceName,
  eventDate,
  eventStartTime,
  imageUrl,
  totalCents,
  done,
}: {
  experienceName?: string | undefined;
  eventDate?: string | undefined;
  eventStartTime?: string | undefined;
  imageUrl?: string | undefined;
  totalCents: number;
  done?: boolean | undefined;
}) {
  const when = [
    eventDate ? formatLongDate(eventDate) : null,
    eventStartTime ? formatTime(eventStartTime.slice(0, 5)) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-center gap-4">
      <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-border bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className={
              imageUrl.includes("framehaus-media")
                ? "size-full object-contain p-1"
                : cn("size-full object-cover", offeringImageFocusClass(imageUrl) ?? "object-center")
            }
          />
        ) : done ? (
          <Check className="size-5" aria-hidden="true" />
        ) : (
          <Camera className="size-5 text-muted-foreground" aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg leading-tight">{experienceName ?? "Studio 7 booking"}</p>
        {when ? <p className="mt-1 text-sm text-muted-foreground">{when}</p> : null}
      </div>
      <span className="shrink-0 font-display text-lg tabular-nums">{formatCents(totalCents)}</span>
    </div>
  );
}

function OptionCard({
  selected,
  onSelect,
  title,
  detail,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "rounded-[18px] border p-5 text-left transition-colors",
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-foreground/40",
      )}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="label-caps text-[10px]">{title}</span>
        {selected ? <Check className="size-4" aria-hidden="true" /> : null}
      </span>
      <span className="mt-2 block text-sm tabular-nums">{detail}</span>
    </button>
  );
}
