/**
 * Studio 7 Miami — Service Agreement template (v1).
 *
 * The template is versioned and hashed. The rendered text a client signs is
 * hashed server-side and stored with the booking as
 * `agreement_template_version` + `agreement_content_hash`.
 */

import {
  EXPERIENCES,
  balanceDueDate,
  calculatePrice,
  formatCents,
  type ExperienceKey,
} from "./pricing";
import {
  formatAddress,
  formatEmail,
  formatEventType,
  formatName,
  formatPhone,
} from "@/lib/format-display";

export const AGREEMENT_TEMPLATE_VERSION = "v1";
export const AGREEMENT_EFFECTIVE_DATE = "2026-01-01";

export type AgreementVars = {
  experience: ExperienceKey;
  durationHours: number;
  stationCount?: number | null | undefined;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  eventLocation: string;
  eventType: string;
  eventDate: string;
  eventStartTime: string;
};

export type AgreementSection = { heading: string; body: string[] };

export type RenderedAgreement = {
  version: string;
  title: string;
  summary: { label: string; value: string }[];
  sections: AgreementSection[];
  /** Canonical plain-text form — this is what gets hashed and stored. */
  text: string;
};

function formatEventDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = Number(h ?? 0);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m ?? "00"} ${suffix} ET`;
}

export function renderAgreement(rawVars: AgreementVars): RenderedAgreement {
  const vars: AgreementVars = {
    ...rawVars,
    clientName: formatName(rawVars.clientName),
    clientEmail: formatEmail(rawVars.clientEmail),
    clientPhone: formatPhone(rawVars.clientPhone),
    eventLocation: formatAddress(rawVars.eventLocation),
    eventType: formatEventType(rawVars.eventType),
  };
  const tier = EXPERIENCES[vars.experience];
  const price = calculatePrice({
    experience: vars.experience,
    durationHours: vars.durationHours,
    stationCount: vars.stationCount ?? 1,
  });
  const dueDate = formatEventDate(balanceDueDate(vars.eventDate));

  const summary: { label: string; value: string }[] = [
    { label: "Client", value: vars.clientName },
    { label: "Contact", value: `${vars.clientEmail} · ${vars.clientPhone}` },
    { label: "Experience", value: tier.name },
    { label: "Event type", value: vars.eventType },
    { label: "Event date", value: formatEventDate(vars.eventDate) },
    { label: "Start time", value: formatTime(vars.eventStartTime) },
    {
      label: "Duration",
      value: `${price.baseHours + price.addlHours} hours${tier.perStation ? " per station" : ""}`,
    },
    ...(tier.perStation
      ? [{ label: "Stations", value: String(price.stationCount) }]
      : []),
    { label: "Location", value: vars.eventLocation },
    { label: "Total", value: formatCents(price.totalCents) },
    { label: "Deposit due at signing (50%)", value: formatCents(price.depositCents) },
    { label: "Balance", value: `${formatCents(price.balanceCents)} — due ${dueDate}` },
  ];

  const sections: AgreementSection[] = [
    {
      heading: "1. Parties & Services",
      body: [
        `This Service Agreement (the "Agreement") is entered into between Studio 7 Miami ("Studio 7", "we", "us") and ${vars.clientName} ("Client", "you").`,
        `Studio 7 will provide the ${tier.name} photobooth experience at ${vars.eventLocation} on ${formatEventDate(vars.eventDate)}, beginning at ${formatTime(vars.eventStartTime)}, for ${price.baseHours + price.addlHours} hours${tier.perStation ? ` across ${price.stationCount} station(s)` : ""}.`,
        `Included with this experience: ${tier.inclusions.join("; ")}.`,
      ],
    },
    {
      heading: "2. Fees & Payment",
      body: [
        `The total fee for the services described above is ${formatCents(price.totalCents)} USD.`,
        `A non-refundable deposit of ${formatCents(price.depositCents)} (50% of the total) is due at the time of signing to reserve your date. Your date is not held until the deposit is received.`,
        `The remaining balance of ${formatCents(price.balanceCents)} is due no later than ${dueDate} (seven days before the event). Studio 7 may treat an unpaid balance as a cancellation by the Client.`,
        `Additional hours added on-site are billed at ${formatCents(tier.additionalHourCents)} per hour and are due at the conclusion of the event.`,
      ],
    },
    {
      heading: "3. Non-Refundable Deposit",
      body: [
        `THE DEPOSIT IS NON-REFUNDABLE. By signing, you acknowledge that the deposit compensates Studio 7 for reserving your date and declining other bookings, and that it will not be refunded if you cancel for any reason.`,
        `If you cancel more than thirty (30) days before the event, Studio 7 will apply the deposit as a credit toward one rescheduled date within twelve (12) months, subject to availability. Cancellations inside thirty (30) days forfeit the deposit in full.`,
      ],
    },
    {
      heading: "4. Client Responsibilities",
      body: [
        `The Client will provide, at no cost to Studio 7: a level operating area of at least 10' x 10' (per station), access to a grounded 110V outlet within 25 feet, adequate lighting for load-in, and parking or loading access for setup and breakdown.`,
        `Studio 7 requires one hour before the start time for setup and thirty minutes after for breakdown. Delays caused by venue access, power availability, or Client readiness reduce booth time and do not extend the booked hours or reduce the fee.`,
      ],
    },
    {
      heading: "5. Conduct, Damage & Safety",
      body: [
        `The Client is responsible for damage to Studio 7 equipment caused by guests, venue staff, or other vendors, and agrees to reimburse the repair or replacement cost.`,
        `Studio 7 may suspend or end service without refund if staff or equipment are subjected to unsafe conditions, harassment, or threatening behavior.`,
      ],
    },
    {
      heading: "6. Media, Likeness & Marketing",
      body: [
        `Photos captured at your event are delivered to you and to participating guests. Studio 7 retains a copy for archival and delivery purposes.`,
        `If you grant marketing permission below, Studio 7 may use selected images from your event in its portfolio, website, and social channels. Declining marketing permission does not affect your service in any way, and you may withdraw permission at any time by written request.`,
      ],
    },
    {
      heading: "7. Force Majeure & Liability",
      body: [
        `Neither party is liable for failure to perform due to events beyond reasonable control, including severe weather, hurricane warnings, power failure, venue closure, or governmental order. In such cases, Studio 7 will offer a rescheduled date within twelve (12) months and retain the deposit as a credit.`,
        `Studio 7's total liability under this Agreement is limited to the amount actually paid by the Client. Studio 7 is not liable for indirect or consequential damages.`,
      ],
    },
    {
      heading: "8. Electronic Signature",
      body: [
        `By drawing your signature and submitting this Agreement, you agree that your electronic signature is the legal equivalent of a handwritten signature and that you intend to be bound by this Agreement.`,
        `Studio 7 records the signature image, the signer's name, the time of signing, the signer's IP address, and browser user agent, together with the version and content hash of this Agreement, as evidence of execution.`,
      ],
    },
    {
      heading: "9. Entire Agreement",
      body: [
        `This Agreement is the entire agreement between the parties regarding the services described and supersedes any prior discussion or quote. It is governed by the laws of the State of Florida, with venue in Miami-Dade County.`,
      ],
    },
  ];

  const text = [
    `STUDIO 7 MIAMI — SERVICE AGREEMENT (${AGREEMENT_TEMPLATE_VERSION})`,
    "",
    ...summary.map((s) => `${s.label}: ${s.value}`),
    "",
    ...sections.flatMap((s) => [s.heading, ...s.body, ""]),
  ]
    .join("\n")
    .trim();

  return {
    version: AGREEMENT_TEMPLATE_VERSION,
    title: "Studio 7 Miami — Service Agreement",
    summary,
    sections,
    text,
  };
}

export const CONSENT_LABEL =
  "I agree to sign electronically and accept the terms of this agreement.";
