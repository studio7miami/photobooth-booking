import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";

export function PaymentTestModeBanner() {
  if (!isPaymentsConfigured()) {
    return (
      <div className="soft-inset rounded-[16px] border border-border px-4 py-2 text-center text-sm text-muted-foreground">
        Live checkout is not configured yet.
      </div>
    );
  }
  if (getStripeEnvironment() === "sandbox") {
    return (
      <div className="soft-inset rounded-[16px] border border-border px-4 py-2 text-center text-sm text-muted-foreground">
        Test mode — use Stripe test cards. No real charges.
      </div>
    );
  }
  return null;
}
