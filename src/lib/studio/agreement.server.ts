import { renderStudioAgreement } from "@/config/studio/agreement";
import type { StudioAgreementVars } from "@/config/studio/agreement";
import { calculateStudioPrice } from "@/config/studio/offerings";
import { balanceDueDate } from "@/config/pricing";
import { clientIpFromHeaders, sha256Hex, type SignatureRecord } from "@/lib/agreement.server";

export async function finalizeStudioSignatureRecord(args: {
  vars: StudioAgreementVars;
  signatureValue: string;
  signerName: string;
  marketingOptIn: boolean;
  headers: Headers;
}): Promise<SignatureRecord> {
  const rendered = renderStudioAgreement(args.vars);
  const hash = await sha256Hex(rendered.text);
  const price = calculateStudioPrice({
    offering: args.vars.offering,
    durationMinutes: args.vars.durationMinutes,
  });
  const signedAt = new Date().toISOString();
  const userAgent = args.headers.get("user-agent") ?? "unknown";
  const ip = clientIpFromHeaders(args.headers);

  return {
    bookingStatus: "agreement_signed",
    agreement_signed: true,
    agreement_template_version: rendered.version,
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
        agreement_template_version: rendered.version,
        agreement_content_hash: hash,
        signer_ip: ip,
        signer_user_agent: userAgent,
        marketing_opt_in: args.marketingOptIn,
      },
    },
  };
}
