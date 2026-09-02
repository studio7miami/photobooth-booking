import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check } from "lucide-react";

import { formatCents, formatInstallmentTotal, REQUIRE_FULL_PAYMENT_WITHIN_DAYS } from "@/config/pricing";
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
  demo?: boolean | undefined;
  remainingOnly?: boolean | undefined;
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
  demo = false,
  remainingOnly = false,
}: Props) {
  const requiresFull =
    !remainingOnly &&
    (!depositEligible ||
      (eventDate ? daysUntil(eventDate) <= REQUIRE_FULL_PAYMENT_WITHIN_DAYS : false));
  const [mode, setMode] = useState<PaymentMode>(requiresFull ? "full" : "deposit");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const payButtonRef = useRef<HTMLButtonElement>(null);

  const effectiveMode: PaymentMode = requiresFull ? "full" : mode;
  const payFull = effectiveMode === "full";
  const dueDate =
    remainingOnly || !payFull ? balanceDueDate : todayEastern();
  const dueLabel = useMemo(
    () => (/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? formatLongDate(dueDate) : ""),
    [dueDate],
  );
  const chargeCents = remainingOnly ? balanceCents : payFull ? totalCents : depositCents;

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
          <EdSpec label="Total" value={formatCents(totalCents)} strong={payFull && !remainingOnly} />
          {remainingOnly ? (
            <EdSpec label="Remaining (50%)" value={formatInstallmentTotal(2, balanceCents)} />
          ) : payFull ? null : (
            <EdSpec label="Deposit (50%)" value={formatInstallmentTotal(1, depositCents)} />
          )}
          {dueLabel ? (
            <EdSpec
              label={remainingOnly || !payFull ? "Balance due date" : "Due"}
              value={dueLabel}
            />
          ) : null}
        </EdSpecs>

        {remainingOnly ? null : requiresFull ? (
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
            {remainingOnly
              ? `Pay remaining · ${formatCents(balanceCents)}`
              : payFull
                ? `Pay in full · ${formatCents(chargeCents)}`
                : `Pay deposit · ${formatCents(chargeCents)}`}
          </EdPrimaryButton>
          <EdCaption>
            Secure checkout · your card is never stored
            {remainingOnly || payFull ? "" : " · Remaining balance can be paid from your confirmation."}
          </EdCaption>
        </div>
      </EdCard>

      <PayCheckoutSheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        bookingId={bookingId}
        paymentMode={remainingOnly ? "balance" : effectiveMode}
        chargeCents={chargeCents}
        experienceName={experienceName}
        eventDate={eventDate}
        eventStartTime={eventStartTime}
        {...(remainingOnly || !payFull
          ? dueLabel
            ? { dueNote: `Balance ${formatCents(balanceCents)} · ${dueLabel}` }
            : { dueNote: `Balance ${formatCents(balanceCents)}` }
          : {})}
        demo={demo}
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
  amountLabel,
  hideAmount,
  done,
}: {
  experienceName?: string | undefined;
  eventDate?: string | undefined;
  eventStartTime?: string | undefined;
  imageUrl?: string | undefined;
  totalCents: number;
  amountLabel?: string | undefined;
  hideAmount?: boolean | undefined;
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
      {hideAmount ? null : (
        <span className="shrink-0 font-display text-base tabular-nums whitespace-nowrap sm:text-lg">
          {amountLabel ?? formatCents(totalCents)}
        </span>
      )}
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
