import { renderAgreement, AGREEMENT_TEMPLATE_VERSION } from "@/config/agreement";
import type { AgreementVars } from "@/config/agreement";
import { balanceDueDate, calculatePrice } from "@/config/pricing";

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function clientIpFromHeaders(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export type SignatureRecord = {
  bookingStatus: "agreement_signed";
  agreement_signed: true;
  agreement_template_version: string;
  agreement_content_hash: string;
  signature_value: string;
  signer_name: string;
  consent: true;
  marketing_opt_in: boolean;
  signed_at: string;
  signer_ip: string;
  signer_user_agent: string;
  total_cents: number;
  deposit_cents: number;
  balance_cents: number;
  balance_due_date: string;
  event: {
    from_state: string;
    to_state: string;
    actor: string;
    meta: Record<string, string | number | boolean>;
  };
};

/**
 * Locks the agreement: recomputes pricing from config (client totals are
 * never trusted), hashes the exact rendered text, and stamps server time,
 * IP, and user agent. Persisting this to `bookings` + `booking_events`
 * happens as soon as the backend is connected — the shape below matches
 * those columns 1:1.
 */
export async function finalizeSignatureRecord(args: {
  vars: AgreementVars;
  signatureValue: string;
  signerName: string;
  marketingOptIn: boolean;
  headers: Headers;
}): Promise<SignatureRecord> {
  const rendered = renderAgreement(args.vars);
  const hash = await sha256Hex(rendered.text);
  const price = calculatePrice({
    experience: args.vars.experience,
    durationHours: args.vars.durationHours,
    stationCount: args.vars.stationCount ?? 1,
  });
  const signedAt = new Date().toISOString();
  const userAgent = args.headers.get("user-agent") ?? "unknown";
  const ip = clientIpFromHeaders(args.headers);

  return {
    bookingStatus: "agreement_signed",
    agreement_signed: true,
    agreement_template_version: AGREEMENT_TEMPLATE_VERSION,
    agreement_content_hash: hash,
    signature_value: args.signatureValue,
    signer_name: args.signerName,
    consent: true,
    marketing_opt_in: args.marketingOptIn,
    signed_at: signedAt,
    signer_ip: ip,
    signer_user_agent: userAgent,
    total_cents: price.totalCents,
    deposit_cents: price.depositCents,
    balance_cents: price.balanceCents,
    balance_due_date: balanceDueDate(args.vars.eventDate),
    event: {
      from_state: "pending_agreement",
      to_state: "agreement_signed",
      actor: "client",
      meta: {
        agreement_template_version: AGREEMENT_TEMPLATE_VERSION,
        agreement_content_hash: hash,
        signer_ip: ip,
        signer_user_agent: userAgent,
        marketing_opt_in: args.marketingOptIn,
      },
    },
  };
}
