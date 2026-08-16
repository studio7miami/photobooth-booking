import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckoutElementsProvider,
  ExpressCheckoutElement,
  PaymentElement,
  useCheckout,
  type StripeCheckoutValue,
} from "@stripe/react-stripe-js/checkout";
import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import { Loader2, X } from "lucide-react";

import { formatCents } from "@/config/pricing";
import { getStripe, getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { createBookingPayment } from "@/lib/payments.functions";
import { publicUrl } from "@/lib/public-base";
import { cn } from "@/lib/utils";
import { EdCaption, EdPrimaryButton } from "./EditorialCard";
import { formatTime } from "./StepTime";

function formatLongDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "America/New_York",
  }).format(new Date(`${date}T12:00:00Z`));
}

export type CheckoutPaymentMode = "deposit" | "full" | "balance";

export function returnUrlFor(bookingId: string): string {
  return `${window.location.origin}${publicUrl("/")}?booking=${bookingId}&paid=1`;
}

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

function dueEyebrow(mode: CheckoutPaymentMode): string {
  if (mode === "full") return "Due now · paid in full";
  if (mode === "balance") return "Due now · remaining balance";
  return "Due now · deposit";
}

export function PayCheckoutSheet({
  open,
  onClose,
  bookingId,
  paymentMode,
  chargeCents,
  experienceName,
  eventDate,
  eventStartTime,
  dueNote,
  demo = false,
}: {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  paymentMode: CheckoutPaymentMode;
  chargeCents: number;
  experienceName?: string | undefined;
  eventDate?: string | undefined;
  eventStartTime?: string | undefined;
  dueNote?: string | undefined;
  demo?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const when = [
    eventDate ? formatLongDate(eventDate) : null,
    eventStartTime ? formatTime(eventStartTime.slice(0, 5)) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const fetchClientSecret = useCallback(async () => {
    if (demo || !isPaymentsConfigured()) {
      throw new Error("Payments are not configured.");
    }
    const result = await createBookingPayment({
      data: {
        bookingId,
        paymentMode,
        environment: getStripeEnvironment(),
        returnUrl: returnUrlFor(bookingId),
      },
    });
    if ("error" in result) {
      setError(result.error);
      throw new Error(result.error);
    }
    return result.clientSecret;
  }, [bookingId, demo, paymentMode]);

  const clientSecret = useMemo(
    () => (open && !demo && isPaymentsConfigured() ? fetchClientSecret() : Promise.resolve("")),
    [fetchClientSecret, open, demo],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose();
      setError(null);
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-foreground/12 backdrop-blur-[8px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-sheet-title"
        aria-describedby="pay-sheet-desc"
        className="ed-glass fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[min(440px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto"
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
            onClick={() => {
              setError(null);
              onClose();
            }}
            className="-mr-1 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="ed-hairline mx-6 mt-5 sm:mx-7" />

        <div className="flex items-end justify-between gap-4 px-6 pt-5 sm:px-7">
          <div className="min-w-0">
            <p className="label-caps text-[10px] text-muted-foreground">{dueEyebrow(paymentMode)}</p>
            {dueNote ? <p className="mt-2 text-sm text-muted-foreground">{dueNote}</p> : null}
          </div>
          <p className="shrink-0 font-display text-4xl leading-none tracking-tight tabular-nums">
            {formatCents(chargeCents)}
          </p>
        </div>
        <p id="pay-sheet-desc" className="sr-only">
          Pay {formatCents(chargeCents)} for your Studio 7 Miami booking.
        </p>

        <div className="px-6 py-6 sm:px-7">
          {demo ? (
            <p className="text-sm text-muted-foreground">
              Preview only — Stripe is not charged from this layout page.
            </p>
          ) : isPaymentsConfigured() ? (
            <CheckoutElementsProvider
              key={paymentMode}
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
          ) : (
            <p className="text-sm text-muted-foreground">
              Checkout is not configured on this deployment yet.
            </p>
          )}
        </div>
      </div>
    </>
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

  const confirmPayment = async (extra?: Parameters<StripeCheckoutValue["confirm"]>[0]) => {
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
          layout: {
            type: "accordion",
            defaultCollapsed: false,
            radios: "never",
            spacedAccordionItems: true,
          },
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
