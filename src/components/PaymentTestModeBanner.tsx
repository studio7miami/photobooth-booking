const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="soft-inset rounded-[16px] border border-border px-4 py-2 text-center text-sm text-muted-foreground">
        Live checkout is not configured yet.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="soft-inset rounded-[16px] border border-border px-4 py-2 text-center text-sm text-muted-foreground">
        Test mode — use Stripe test cards. No real charges.
      </div>
    );
  }
  return null;
}
