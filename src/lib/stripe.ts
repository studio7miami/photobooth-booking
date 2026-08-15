import { loadStripe, type Stripe } from "@stripe/stripe-js";

type StripeEnv = "sandbox" | "live";

let runtimeToken: string | undefined;
let stripePromise: Promise<Stripe | null> | null = null;

function isPublishableKey(token: string | undefined): token is string {
  return Boolean(token?.startsWith("pk_test_") || token?.startsWith("pk_live_"));
}

function envToken(): string | undefined {
  const token = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;
  return isPublishableKey(token) ? token : undefined;
}

function clientToken(): string | undefined {
  return runtimeToken ?? envToken();
}

/** Call from the root loader so a Vercel runtime env var still reaches Checkout. */
export function setPaymentsClientToken(token: string | undefined) {
  const next = token?.trim();
  if (!isPublishableKey(next)) return;
  if (runtimeToken === next) return;
  runtimeToken = next;
  stripePromise = null;
}

export function isPaymentsConfigured(): boolean {
  return Boolean(clientToken());
}

export function getStripeEnvironment(): StripeEnv {
  const token = clientToken();
  if (token?.startsWith("pk_test_")) return "sandbox";
  if (token?.startsWith("pk_live_")) return "live";
  throw new Error(
    "Payments are not configured for this build. Add VITE_PAYMENTS_CLIENT_TOKEN on Vercel and redeploy.",
  );
}

export function getStripe(): Promise<Stripe | null> {
  const token = clientToken();
  if (!token) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(token);
  return stripePromise;
}
