/**
 * Studio 7 Miami — in-studio service agreement.
 *
 * Photobooth rentals keep src/config/agreement.ts. Photo sessions and class
 * use studio-v1. Space rentals use studio-rental-v1.
 */

import { balanceDueDate, formatCents } from "@/config/pricing";
import {
  calculateStudioPrice,
  formatDurationMinutes,
  STUDIO_OFFERINGS,
  type StudioOffering,
  type StudioOfferingKey,
  type StudioPriceBreakdown,
} from "./offerings";
import { STUDIO_LOCATION } from "./booking-rules";
import { formatEmail, formatName, formatPhone } from "@/lib/format-display";

export const STUDIO_AGREEMENT_TEMPLATE_VERSION = "studio-v1";
export const STUDIO_RENTAL_AGREEMENT_TEMPLATE_VERSION = "studio-rental-v2";

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
  shooterId?: string | undefined;
  shooterName?: string | undefined;
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

function paymentLines(price: StudioPriceBreakdown, dueDate: string): string[] {
  const payInFull = !price.depositEligible || price.balanceCents === 0;
  const lines = payInFull
    ? [
        `The total fee for this reservation is ${formatCents(price.totalCents)} USD, due in full at the time of booking. The reservation is not confirmed until payment is received.`,
      ]
    : [
        `The total fee for this reservation is ${formatCents(price.totalCents)} USD.`,
        `A deposit of ${formatCents(price.depositCents)} (50% of the total) is due at the time of signing. The reservation is not confirmed until the deposit is received.`,
        `The remaining balance of ${formatCents(price.balanceCents)} must be paid no later than ${dueDate}.`,
      ];
  if (price.extraSlots > 0) {
    lines.push(
      `This booking includes ${price.extraSlots} additional hour${price.extraSlots === 1 ? "" : "s"} at ${formatCents(price.extraRateCents)} each.`,
    );
  }
  return lines;
}

function rentalSections(
  vars: StudioAgreementVars,
  offering: StudioOffering,
  price: StudioPriceBreakdown,
  dueDate: string,
): AgreementSection[] {
  return [
    {
      heading: "Studio Rental & Service Agreement",
      body: [
        "Welcome to Studio 7 Miami. Our goal is to provide a professional, creative, clean, and safe environment for every client and guest.",
        `By booking Studio 7 Miami, the person or company making the reservation ("Client") agrees to the following terms and conditions.`,
        `This reservation is the ${offering.name} at ${vars.eventLocation} on ${formatEventDate(vars.eventDate)}, beginning at ${formatTime(vars.eventStartTime)}, for ${formatDurationMinutes(price.totalMinutes)}.`,
      ],
    },
    {
      heading: "1. Booking & Payment",
      body: [
        "A reservation is not confirmed until the required payment or deposit has been received.",
        ...paymentLines(price, dueDate),
        "Any remaining balance must be paid according to the deadline provided on the invoice or booking confirmation.",
        "Studio 7 Miami reserves the right to deny access to the space when required payments have not been completed.",
        "Any additional charges incurred during the reservation, including overtime, damages, excessive cleaning, additional services, or approved add-ons, are the Client's responsibility.",
      ],
    },
    {
      heading: "2. Cancellations & Rescheduling",
      body: [
        "All booking payments and deposits are non-refundable unless otherwise stated in writing by Studio 7 Miami.",
        "Clients may request one complimentary reschedule when at least 48 hours' notice is provided. The new date is subject to studio availability.",
        "Rescheduling requests made less than 48 hours before the reservation may be subject to a rescheduling fee or new booking deposit.",
        "Same-day cancellations and no-shows forfeit payments already made.",
        "Repeated rescheduling may require a new reservation and payment.",
      ],
    },
    {
      heading: "3. Rental Time",
      body: [
        "The Client's reservation begins and ends at the times listed on the booking confirmation.",
        "Setup and breakdown must take place within the reserved time.",
        "Clients may not enter the studio before their scheduled start time unless approved by Studio 7 Miami.",
        "By the scheduled end time, all guests, equipment, decorations, personal belongings, and production materials must be removed from the space.",
        "Additional studio time may be purchased when availability permits.",
        "Remaining in the studio beyond the scheduled reservation may result in overtime charges.",
      ],
    },
    {
      heading: "4. Client & Guest Responsibility",
      body: [
        "The person or company making the reservation is responsible for all individuals brought into Studio 7 Miami during the booking.",
        "This includes photographers, videographers, models, talent, clients, vendors, stylists, makeup artists, assistants, children, guests, and other attendees.",
        "The Client is responsible for ensuring that their guests follow Studio 7 Miami policies and reasonable instructions provided by studio staff.",
        "Damage or excessive cleaning caused by a Client's guest remains the responsibility of the Client.",
      ],
    },
    {
      heading: "5. Studio Capacity & Booking Purpose",
      body: [
        "The Client must accurately disclose the intended purpose of the reservation and the expected number of attendees.",
        "A studio rental may not be converted into a larger event, party, production, class, workshop, or other materially different use without prior approval from Studio 7 Miami.",
        "Additional charges may apply when the actual use or attendance exceeds what was originally booked.",
        "Studio 7 Miami reserves the right to enforce applicable occupancy and safety limits.",
      ],
    },
    {
      heading: "6. Property Damage",
      body: [
        "Clients are responsible for damage beyond ordinary wear and tear caused during their reservation.",
        "This includes damage to studio:",
        "• Walls and floors",
        "• Furniture",
        "• Mirrors",
        "• Doors and windows",
        "• Props and décor",
        "• Lighting or production equipment",
        "• Cyclorama walls",
        "• Makeup and dressing areas",
        "• Bathrooms",
        "• Fixtures",
        "• Other Studio 7 Miami property",
        "The Client may be invoiced for reasonable cleaning, repair, restoration, or replacement costs resulting from damage caused during their reservation.",
      ],
    },
    {
      heading: "7. Cyclorama Wall",
      body: [
        "The cyclorama wall is a professional studio surface and must be treated with care.",
        "Normal use is permitted. However, excessive footprints, stains, scuffs, spills, paint, punctures, scratches, or other damage may result in an additional cleaning, repainting, or repair fee.",
        "Any painting, attaching materials, drilling, or modification of the cyclorama requires prior approval from Studio 7 Miami.",
      ],
    },
    {
      heading: "8. Cleaning",
      body: [
        "Clients are expected to leave the studio in reasonably similar condition to how it was received.",
        "All trash, personal belongings, decorations, production materials, and equipment brought into the studio must be removed or properly disposed of before leaving.",
        "Additional cleaning fees may apply for excessive mess, including:",
        "• Confetti",
        "• Glitter",
        "• Excessive trash",
        "• Food or drink spills",
        "• Makeup or body paint",
        "• Stains",
        "• Decorations left behind",
        "• Excessively dirty floors",
        "• Furniture left out of place",
        "• Other conditions requiring extraordinary cleaning",
        "Glitter, confetti, or similarly difficult-to-clean materials require prior approval.",
      ],
    },
    {
      heading: "9. Furniture, Props & Equipment",
      body: [
        "Approved furniture and props may be moved carefully during a reservation.",
        "Furniture may not be dragged across studio floors.",
        "All moved items must be returned to their original location before the end of the reservation.",
        "Permanently installed fixtures or equipment may not be moved, removed, disconnected, altered, or modified without permission.",
        "Clients are responsible for damage caused by improper use of Studio 7 Miami equipment or property.",
      ],
    },
    {
      heading: "10. Smoking & Vaping",
      body: [
        "Smoking and vaping are prohibited inside Studio 7 Miami.",
        "Clients are responsible for ensuring that all guests follow this policy.",
        "Violations may result in cleaning charges and/or termination of the reservation.",
      ],
    },
    {
      heading: "11. Minors",
      body: [
        "All minors must remain under appropriate adult supervision while inside Studio 7 Miami.",
        "Studio 7 Miami is not responsible for supervising children or minors participating in or attending a Client's reservation.",
        "The Client remains responsible for the conduct of minors associated with their booking.",
      ],
    },
    {
      heading: "12. Prohibited & Unsafe Activity",
      body: [
        "Illegal, dangerous, destructive, or unauthorized activities are prohibited.",
        "Weapons, hazardous materials, pyrotechnics, unauthorized open flames, and activities that create an unreasonable risk of injury or property damage are not permitted.",
        "Smoke machines, special effects, large installations, unusual production equipment, or activities that may affect the studio property require prior approval.",
        "Studio 7 Miami reserves the right to immediately stop any activity reasonably believed to present a safety risk or risk of property damage.",
      ],
    },
    {
      heading: "13. Conduct",
      body: [
        "Clients and guests are expected to behave professionally and respectfully toward Studio 7 Miami staff, property, neighboring businesses, and other individuals on the premises.",
        "Studio 7 Miami reserves the right to terminate a reservation for illegal, threatening, dangerous, destructive, or seriously disruptive conduct.",
        "A reservation terminated because of Client or guest misconduct may not be eligible for a refund.",
      ],
    },
    {
      heading: "14. Personal Property",
      body: [
        "Clients are responsible for their own equipment and personal belongings.",
        "To the extent permitted by law, Studio 7 Miami is not responsible for items that are lost, stolen, forgotten, misplaced, or damaged while on the premises.",
        "Clients should inspect the studio for personal belongings before leaving.",
      ],
    },
    {
      heading: "15. Assumption of Risk",
      body: [
        "The Client understands that photography, videography, events, productions, equipment use, movement of furniture, and other studio activities may involve ordinary risks.",
        "Clients and guests are responsible for acting safely and following reasonable studio instructions.",
        "To the fullest extent permitted by applicable law, the Client assumes responsibility for risks arising from the Client's activities and the activities of individuals participating under the Client's reservation.",
        "Nothing in this Agreement is intended to waive liability that cannot legally be waived.",
      ],
    },
    {
      heading: "16. Insurance",
      body: [
        "Studio 7 Miami may require certain productions, events, organizations, vendors, or commercial clients to provide proof of insurance before accessing the studio.",
        "When required, insurance requirements will be communicated before the reservation.",
        "Failure to provide requested documentation may result in the reservation being postponed or canceled according to the applicable booking terms.",
      ],
    },
    {
      heading: "17. Security & Monitoring",
      body: [
        "For safety, security, and property protection, security cameras may operate in designated common and studio areas.",
        "Security cameras are not installed in bathrooms or designated private changing areas.",
      ],
    },
    {
      heading: "18. Studio Cancellation or Interruption",
      body: [
        "In the unlikely event that Studio 7 Miami cannot provide the reserved space because of an emergency, serious maintenance issue, utility interruption, unsafe condition, or other circumstance making the studio unavailable, Studio 7 Miami may offer the Client a rescheduled date or refund of the affected studio rental payment.",
        "To the fullest extent permitted by law, Studio 7 Miami is not responsible for consequential expenses or losses associated with the interruption, including outside vendors, talent, transportation, equipment rentals, or lost business opportunities.",
      ],
    },
    {
      heading: "19. Agreement & Acknowledgment",
      body: [
        "By signing below, the Client confirms that they:",
        "• Have read and understand this Studio Rental & Service Agreement.",
        "• Agree to follow Studio 7 Miami policies.",
        "• Accept responsibility for their guests and activities.",
        "• Understand the cancellation and rescheduling policy.",
        "• Understand that setup and breakdown are included within the reserved rental time.",
        "• Accept responsibility for applicable overtime, damage, repair, or excessive cleaning charges.",
        "This Agreement, together with the Client's booking confirmation, invoice, and any applicable written addendum, represents the terms governing the reservation.",
        "This Agreement is governed by the laws of the State of Florida, with venue in Miami-Dade County.",
      ],
    },
    {
      heading: "20. Electronic Signature",
      body: [
        "By drawing your signature and submitting this Agreement, you agree that your electronic signature is the legal equivalent of a handwritten signature and that you intend to be bound by this Agreement.",
        "Studio 7 records the signature image, the signer's name, the time of signing, the signer's IP address, and browser user agent, together with the version and content hash of this Agreement, as evidence of execution.",
      ],
    },
  ];
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
  const isRental = offering.group === "rentals";
  const dueDate = formatEventDate(balanceDueDate(vars.eventDate));
  const payInFull = !price.depositEligible || price.balanceCents === 0;

  if (isRental) {
    const summary: { label: string; value: string }[] = [
      { label: "Client / Company Name", value: vars.clientName },
      { label: "Phone", value: vars.clientPhone },
      { label: "Email", value: vars.clientEmail },
      { label: "Booking Date", value: formatEventDate(vars.eventDate) },
      { label: "Reservation Time", value: formatTime(vars.eventStartTime) },
      { label: "Type of Booking", value: offering.name },
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
    const sections = rentalSections(vars, offering, price, dueDate);
    const version = STUDIO_RENTAL_AGREEMENT_TEMPLATE_VERSION;
    const text = [
      `STUDIO 7 MIAMI — STUDIO RENTAL & SERVICE AGREEMENT (${version})`,
      "",
      ...summary.map((s) => `${s.label}: ${s.value}`),
      "",
      ...sections.flatMap((s) => [s.heading, ...s.body, ""]),
    ]
      .join("\n")
      .trim();
    return {
      version,
      title: "Studio 7 Miami — Studio Rental & Service Agreement",
      summary,
      sections,
      text,
    };
  }

  const summary: { label: string; value: string }[] = [
    { label: "Client", value: vars.clientName },
    { label: "Contact", value: `${vars.clientEmail} · ${vars.clientPhone}` },
    { label: "Session", value: offering.name },
    ...(vars.shooterName ? [{ label: "Shooter", value: vars.shooterName }] : []),
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
        vars.shooterId === "surprise"
          ? "Studio 7 will assign a photographer for this session."
          : vars.shooterName
            ? `Your photographer for this session is ${vars.shooterName}.`
            : null,
        `Included with this session: ${offering.inclusions.join("; ")}.`,
        `Please arrive on time. Late arrival shortens the session and does not reduce the fee.`,
      ].filter((line): line is string => Boolean(line));

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

export const STUDIO_RENTAL_CONSENT_LABEL =
  "I acknowledge that I have read, understood, and agree to the Studio 7 Miami Studio Rental & Service Agreement.";
