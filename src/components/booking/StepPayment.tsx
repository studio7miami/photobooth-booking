import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckoutElementsProvider,
  ExpressCheckoutElement,
  PaymentElement,
  useCheckout,
  type StripeCheckoutValue,
} from "@stripe/react-stripe-js/checkout";
import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import { Camera, Check, Loader2, X } from "lucide-react";

import { formatCents } from "@/config/pricing";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createBookingPayment } from "@/lib/payments.functions";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

import { publicUrl } from "@/lib/public-base";
import {
  EdCaption,
  EdCard,
  EdPrimaryButton,
  EdSpec,
  EdSpecs,
} from "./EditorialCard";
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
};

export function formatLongDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "America/New_York",
  }).format(new Date(`${date}T12:00:00Z`));
}

/** Today's date in America/New_York as YYYY-MM-DD. */
function todayEastern(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

function daysUntil(date: string): number {
  const a = Date.parse(`${todayEastern()}T00:00:00Z`);
  const b = Date.parse(`${date}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

function returnUrlFor(bookingId: string): string {
  return `${window.location.origin}${publicUrl("/")}?booking=${bookingId}&paid=1`;
}

/** Hairline fields on the pay sheet — Stripe still owns the inputs. */
const PAY_SHEET_APPEARANCE = {
  theme: "flat" as const,
  variables: {
    colorPrimary: "#111111",
    colorBackground: "#FCFCFA",
    colorText: "#111111",
    colorTextSecondary: "#6F6F6B",
    colorTextPlaceholder: "#6F6F6B",
    colorDanger: "#B42318",
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif",
    fontSizeBase: "16px",
    spacingUnit: "4px",
    spacingGridRow: "16px",
    borderRadius: "0px",
    focusBoxShadow: "none",
    focusOutline: "none",
  },
  rules: {
    ".Input": {
      backgroundColor: "transparent",
      border: "none",
      borderBottom: "1px solid rgba(17, 17, 17, 0.08)",
      boxShadow: "none",
      paddingTop: "8px",
      paddingBottom: "8px",
      paddingLeft: "0",
      paddingRight: "0",
    },
    ".Input:focus": {
      borderBottom: "1px solid #111111",
      boxShadow: "none",
    },
    ".Label": {
      fontSize: "10px",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      fontWeight: "500",
      color: "#6F6F6B",
    },
    ".Tab": {
      border: "1px solid rgba(17, 17, 17, 0.08)",
      borderRadius: "14px",
      boxShadow: "none",
      backgroundColor: "transparent",
    },
    ".Tab--selected": {
      border: "1px solid #111111",
      backgroundColor: "#111111",
      color: "#FCFCFA",
    },
    ".Block": {
      backgroundColor: "transparent",
      boxShadow: "none",
      border: "none",
    },
  },
};

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
}: Props) {
  // Events inside 7 days must be paid in full — there's no window left to
  // collect a balance.
  const requiresFull = eventDate ? daysUntil(eventDate) <= 7 : false;
  const [mode, setMode] = useState<PaymentMode>(requiresFull ? "full" : "deposit");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const payButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  const effectiveMode: PaymentMode = requiresFull ? "full" : mode;
  const payFull = effectiveMode === "full";
  const dueLabel = useMemo(
    () => formatLongDate(payFull ? todayEastern() : balanceDueDate),
    [balanceDueDate, payFull],
  );
  const chargeCents = payFull ? totalCents : depositCents;
  const when = [eventDate ? formatLongDate(eventDate) : null, eventStartTime ? formatTime(eventStartTime) : null]
    .filter(Boolean)
    .join(" · ");

  const fetchClientSecret = useCallback(async () => {
    const result = await createBookingPayment({
      data: {
        bookingId,
        paymentMode: effectiveMode,
        environment: getStripeEnvironment(),
        returnUrl: returnUrlFor(bookingId),
      },
    });
    if ("error" in result) {
      setError(result.error);
      throw new Error(result.error);
    }
    return result.clientSecret;
  }, [bookingId, effectiveMode]);

  // Stripe.js + Checkout Session start together; the provider accepts the
  // promise so Elements can init without waiting for the secret string.
  const clientSecret = useMemo(() => fetchClientSecret(), [fetchClientSecret]);

  useEffect(() => {
    void getStripe();
  }, []);

  useEffect(() => {
    if (!checkoutOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setCheckoutOpen(false);
      setError(null);
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [checkoutOpen]);

  useEffect(() => {
    if (checkoutOpen) {
      wasOpen.current = true;
      closeButtonRef.current?.focus();
      return;
    }
    if (wasOpen.current) payButtonRef.current?.focus({ preventScroll: true });
  }, [checkoutOpen]);

  const closeCheckout = () => {
    setCheckoutOpen(false);
    setError(null);
  };

  const selectMode = (next: PaymentMode) => {
    if (next === effectiveMode) return;
    setError(null);
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
            Your event is within 7 days, so this booking is paid in full today.
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
            {payFull ? "" : " · Balance link sent 7 days before your event."}
          </EdCaption>
        </div>

        {error && !checkoutOpen ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      </EdCard>

      {checkoutOpen ? (
        <div
          className="fixed inset-0 z-40 bg-foreground/12 backdrop-blur-[8px]"
          onClick={closeCheckout}
        />
      ) : null}

      <div
        role="dialog"
        aria-modal={checkoutOpen}
        aria-labelledby="pay-sheet-title"
        aria-describedby="pay-sheet-desc"
        aria-hidden={!checkoutOpen}
        className={cn(
          "ed-glass fixed left-1/2 top-1/2 flex max-h-[92vh] w-[min(440px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto",
          checkoutOpen ? "z-50" : "pointer-events-none -z-10 opacity-0",
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-7">
          <div className="min-w-0">
            <p id="pay-sheet-title" className="font-display text-lg leading-tight">
              {experienceName ?? "Studio 7 booking"}
            </p>
            {when ? <p className="mt-1 text-sm text-muted-foreground">{when}</p> : null}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close checkout"
            onClick={closeCheckout}
            className="-mr-1 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="ed-hairline mx-6 mt-5 sm:mx-7" />

        <div className="flex items-end justify-between gap-4 px-6 pt-5 sm:px-7">
          <div className="min-w-0">
            <p className="label-caps text-[10px] text-muted-foreground">
              {payFull ? "Due now · paid in full" : "Due now · deposit"}
            </p>
            {payFull ? null : (
              <p className="mt-2 text-sm text-muted-foreground">
                Balance {formatCents(balanceCents)} · {formatLongDate(balanceDueDate)}
              </p>
            )}
          </div>
          <p className="shrink-0 font-display text-4xl leading-none tracking-tight tabular-nums">
            {formatCents(chargeCents)}
          </p>
        </div>
        <p id="pay-sheet-desc" className="sr-only">
          {payFull
            ? `Pay your Studio 7 Miami booking in full — ${formatCents(chargeCents)} due today.`
            : `Pay a ${formatCents(chargeCents)} deposit to hold your date, with ${formatCents(balanceCents)} due ${formatLongDate(balanceDueDate)}.`}
        </p>

        <div className="px-6 py-6 sm:px-7">
          <CheckoutElementsProvider
            key={effectiveMode}
            stripe={getStripe()}
            options={{
              clientSecret,
              elementsOptions: {
                appearance: PAY_SHEET_APPEARANCE,
                savedPaymentMethod: { enableSave: "never" },
              },
            }}
          >
            <PaySheetForm
              bookingId={bookingId}
              chargeCents={chargeCents}
              error={error}
              onError={setError}
            />
          </CheckoutElementsProvider>
        </div>
      </div>
    </div>
  );
}

function PaySheetForm({
  bookingId,
  chargeCents,
  error,
  onError,
}: {
  bookingId: string;
  chargeCents: number;
  error: string | null;
  onError: (message: string | null) => void;
}) {
  const checkoutState = useCheckout();
  const [walletsReady, setWalletsReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (checkoutState.type === "loading") return <PaySheetSkeleton />;
  if (checkoutState.type === "error") {
    return <p className="text-sm text-destructive">{checkoutState.error.message}</p>;
  }

  const checkout = checkoutState.checkout;
  const payLabel = `Pay ${formatCents(chargeCents)}`;

  const confirmPayment = async (
    extra?: Parameters<StripeCheckoutValue["confirm"]>[0],
  ) => {
    onError(null);
    setSubmitting(true);
    try {
      const result = await checkout.confirm(extra);
      if (result.type === "error") {
        onError(result.error.message);
        return;
      }
      window.location.assign(returnUrlFor(bookingId));
    } catch (err) {
      onError(err instanceof Error ? err.message : "Payment could not be completed.");
    } finally {
      setSubmitting(false);
    }
  };

  const onExpressConfirm = (event: StripeExpressCheckoutElementConfirmEvent) => {
    void confirmPayment({ expressCheckoutConfirmEvent: event });
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void confirmPayment();
      }}
    >
      <div className={walletsReady ? undefined : "min-h-[44px]"}>
        <ExpressCheckoutElement
          options={{
            layout: { maxColumns: 2, overflow: "never" },
            paymentMethodOrder: ["apple_pay", "google_pay", "link"],
            paymentMethods: {
              amazonPay: "never",
              applePay: "always",
              googlePay: "always",
              link: "auto",
            },
          }}
          onConfirm={onExpressConfirm}
          onReady={(event) => {
            const methods = event.availablePaymentMethods;
            setWalletsReady(Boolean(methods && Object.values(methods).some(Boolean)));
          }}
        />
        {walletsReady ? (
          <div className="mt-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="label-caps text-[10px] text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        ) : null}
      </div>

      <PaymentElement
        options={{
          layout: { type: "accordion", defaultCollapsed: false, radios: "never", spacedAccordionItems: true },
          wallets: { applePay: "never", googlePay: "never", link: "never" },
          fields: {
            billingDetails: {
              email: "never",
            },
          },
        }}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <EdPrimaryButton type="submit" disabled={submitting || !checkout.canConfirm}>
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Paying
          </span>
        ) : (
          payLabel
        )}
      </EdPrimaryButton>
      <EdCaption>Secure checkout · your card is never stored</EdCaption>
    </form>
  );
}

function PaySheetSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="h-11 animate-pulse rounded-[12px] bg-muted" />
      <div className="ed-hairline h-10" />
      <div className="ed-hairline h-10" />
      <div className="grid grid-cols-2 gap-4">
        <div className="ed-hairline h-10" />
        <div className="ed-hairline h-10" />
      </div>
      <div className="h-12 animate-pulse rounded-full bg-muted" />
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
  const when = [eventDate ? formatLongDate(eventDate) : null, eventStartTime]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-center gap-4">
      <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-border bg-muted">
        {done ? (
          <Check className="size-5" aria-hidden="true" />
        ) : imageUrl ? (
          <img src={imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <Camera className="size-5 text-muted-foreground" aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg leading-tight">
          {experienceName ?? "Studio 7 booking"}
        </p>
        {when ? <p className="mt-1 text-sm text-muted-foreground">{when}</p> : null}
      </div>
      <span className="shrink-0 font-display text-lg tabular-nums">
        {formatCents(totalCents)}
      </span>
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
