/**
 * Studio 7 Miami — in-studio service agreement (studio-v1).
 *
 * Photobooth rentals keep src/config/agreement.ts. This template covers
 * photo sessions and CJ's acting class.
 */

import { balanceDueDate, formatCents } from "@/config/pricing";
import {
  calculateStudioPrice,
  formatDurationMinutes,
  STUDIO_OFFERINGS,
  type StudioOfferingKey,
} from "./offerings";
import { STUDIO_LOCATION } from "./booking-rules";
import { formatEmail, formatName, formatPhone } from "@/lib/format-display";

export const STUDIO_AGREEMENT_TEMPLATE_VERSION = "studio-v1";

export type StudioAgreementVars = {
  offering: StudioOfferingKey;
  durationMinutes: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  eventLocation: string;
  eventDate: string;
  eventStartTime: string;
  clientNotes?: string | undefined;
  classSessionId?: string | undefined;
};

export type AgreementSection = { heading: string; body: string[] };

export type RenderedAgreement = {
  version: string;
  title: string;
  summary: { label: string; value: string }[];
  sections: AgreementSection[];
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

export function renderStudioAgreement(rawVars: StudioAgreementVars): RenderedAgreement {
  const vars: StudioAgreementVars = {
    ...rawVars,
    clientName: formatName(rawVars.clientName),
    clientEmail: formatEmail(rawVars.clientEmail),
    clientPhone: formatPhone(rawVars.clientPhone),
    eventLocation: rawVars.eventLocation.trim() || STUDIO_LOCATION,
  };
  const offering = STUDIO_OFFERINGS[vars.offering];
  const price = calculateStudioPrice({
    offering: vars.offering,
    durationMinutes: vars.durationMinutes,
  });
  const isClass = offering.resource === "studio_acting";
  const dueDate = formatEventDate(balanceDueDate(vars.eventDate));
  const payInFull = !offering.depositEligible || price.balanceCents === 0;

  const summary: { label: string; value: string }[] = [
    { label: "Client", value: vars.clientName },
    { label: "Contact", value: `${vars.clientEmail} · ${vars.clientPhone}` },
    { label: "Session", value: offering.name },
    { label: "Date", value: formatEventDate(vars.eventDate) },
    { label: "Start time", value: formatTime(vars.eventStartTime) },
    { label: "Duration", value: formatDurationMinutes(price.totalMinutes) },
    { label: "Location", value: vars.eventLocation },
    { label: "Total", value: formatCents(price.totalCents) },
    ...(payInFull
      ? [{ label: "Payment", value: `${formatCents(price.totalCents)} due at booking` }]
      : [
          { label: "Deposit due at signing (50%)", value: formatCents(price.depositCents) },
          { label: "Balance", value: `${formatCents(price.balanceCents)} — due ${dueDate}` },
        ]),
  ];

  const feeSection: string[] = payInFull
    ? [
        `The total fee for the services described above is ${formatCents(price.totalCents)} USD, due in full at the time of booking. Your time is not held until payment is received.`,
        `This fee is non-refundable once paid, except as described in the cancellation section below.`,
      ]
    : [
        `The total fee for the services described above is ${formatCents(price.totalCents)} USD.`,
        `A non-refundable deposit of ${formatCents(price.depositCents)} (50% of the total) is due at the time of signing to reserve your date. Your date is not held until the deposit is received.`,
        `The remaining balance of ${formatCents(price.balanceCents)} is due no later than ${dueDate} (seven days before the session). Studio 7 may treat an unpaid balance as a cancellation by the Client.`,
      ];

  if (price.extraSlots > 0) {
    feeSection.push(
      `This booking includes ${price.extraSlots} additional ${price.extraSlotMinutes}-minute increment(s) at ${formatCents(price.extraRateCents)} each.`,
    );
  }

  const serviceBody = isClass
    ? [
        `Studio 7 will provide a seat in ${offering.name} at ${vars.eventLocation} on ${formatEventDate(vars.eventDate)}, beginning at ${formatTime(vars.eventStartTime)}, for ${formatDurationMinutes(price.totalMinutes)}.`,
        `This is a group class. Capacity is limited. Included: ${offering.inclusions.join("; ")}.`,
        `Please arrive a few minutes early, dressed to work, and ready to take direction.`,
      ]
    : [
        `Studio 7 will provide the ${offering.name} session at ${vars.eventLocation} on ${formatEventDate(vars.eventDate)}, beginning at ${formatTime(vars.eventStartTime)}, for ${formatDurationMinutes(price.totalMinutes)}.`,
        `Included with this session: ${offering.inclusions.join("; ")}.`,
        `Please arrive on time. Late arrival shortens the session and does not reduce the fee.`,
      ];

  const sections: AgreementSection[] = [
    {
      heading: "1. Parties & Services",
      body: [
        `This Service Agreement (the "Agreement") is entered into between Studio 7 Miami ("Studio 7", "we", "us") and ${vars.clientName} ("Client", "you").`,
        ...serviceBody,
      ],
    },
    {
      heading: "2. Fees & Payment",
      body: feeSection,
    },
    {
      heading: "3. Cancellation & Rescheduling",
      body: isClass
        ? [
            `Class fees are non-refundable. If you cancel more than forty-eight (48) hours before the class, Studio 7 will apply the fee as a credit toward one future class within ninety (90) days, subject to available seats.`,
            `Cancellations inside forty-eight (48) hours, and no-shows, forfeit the fee.`,
          ]
        : [
            `THE DEPOSIT (OR FULL PAYMENT, IF PAID IN FULL) IS NON-REFUNDABLE. By signing, you acknowledge that the payment compensates Studio 7 for reserving your time and declining other bookings.`,
            `If you cancel more than seven (7) days before the session, Studio 7 will apply the amount paid as a credit toward one rescheduled date within twelve (12) months, subject to availability. Cancellations inside seven (7) days forfeit the amount paid.`,
          ],
    },
    {
      heading: isClass ? "4. Class Conduct" : "4. Session Conduct",
      body: isClass
        ? [
            `Students treat classmates, instructors, and the studio with respect. Studio 7 may ask anyone who disrupts the class to leave without refund.`,
            `Scene work may be physically and emotionally demanding. Participate within your limits and tell the instructor if you need to sit out.`,
          ]
        : [
            `The Client is responsible for damage to Studio 7 equipment or the studio space caused during the session, and agrees to reimburse the repair or replacement cost.`,
            `Studio 7 may suspend or end the session without refund if staff or equipment are subjected to unsafe conditions, harassment, or threatening behavior.`,
          ],
    },
    {
      heading: isClass ? "5. Likeness & Marketing" : "5. Images, Likeness & Marketing",
      body: isClass
        ? [
            `Studio 7 may photograph or record class for archival and teaching use.`,
            `If you grant marketing permission below, Studio 7 may mention this class or use selected stills in its portfolio, website, and social channels. Declining does not affect your seat, and you may withdraw permission at any time by written request.`,
          ]
        : [
            `Edited images from your session are delivered to you. Studio 7 retains a copy for archival and delivery purposes.`,
            `Studio 7 retains copyright in the photographs. Your booking includes a personal-use license for the delivered gallery. Commercial licensing is available separately.`,
            `If you grant marketing permission below, Studio 7 may use selected images from your session in its portfolio, website, and social channels. Declining marketing permission does not affect your service, and you may withdraw permission at any time by written request.`,
          ],
    },
    {
      heading: "6. Force Majeure & Liability",
      body: [
        `Neither party is liable for failure to perform due to events beyond reasonable control, including severe weather, hurricane warnings, power failure, or governmental order. In such cases, Studio 7 will offer a rescheduled date and retain amounts paid as a credit.`,
        `Studio 7's total liability under this Agreement is limited to the amount actually paid by the Client. Studio 7 is not liable for indirect or consequential damages.`,
      ],
    },
    {
      heading: "7. Electronic Signature",
      body: [
        `By drawing your signature and submitting this Agreement, you agree that your electronic signature is the legal equivalent of a handwritten signature and that you intend to be bound by this Agreement.`,
        `Studio 7 records the signature image, the signer's name, the time of signing, the signer's IP address, and browser user agent, together with the version and content hash of this Agreement, as evidence of execution.`,
      ],
    },
    {
      heading: "8. Entire Agreement",
      body: [
        `This Agreement is the entire agreement between the parties regarding the services described and supersedes any prior discussion or quote. It is governed by the laws of the State of Florida, with venue in Miami-Dade County.`,
      ],
    },
  ];

  const text = [
    `STUDIO 7 MIAMI — STUDIO SERVICE AGREEMENT (${STUDIO_AGREEMENT_TEMPLATE_VERSION})`,
    "",
    ...summary.map((s) => `${s.label}: ${s.value}`),
    "",
    ...sections.flatMap((s) => [s.heading, ...s.body, ""]),
  ]
    .join("\n")
    .trim();

  return {
    version: STUDIO_AGREEMENT_TEMPLATE_VERSION,
    title: "Studio 7 Miami — Studio Service Agreement",
    summary,
    sections,
    text,
  };
}

export const STUDIO_CONSENT_LABEL =
  "I agree to sign electronically and accept the terms of this agreement.";
