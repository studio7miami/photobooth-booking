import { formatCents, formatPaidTotal } from "@/config/pricing";
import { escapeHtml, renderStudioEmail, STUDIO_ADDRESS_HTML, type EmailSpec } from "./template";

export type BookingEmailKind = "photobooth" | "studio" | "class";

export type BookingEmailModel = {
  kind: BookingEmailKind;
  clientName: string;
  clientEmail: string;
  experienceName: string;
  shooterName?: string | null;
  eventDate: string;
  eventTime: string;
  location: string;
  locationIsStudio?: boolean;
  totalCents: number;
  paidCents: number;
  isDeposit: boolean;
  balanceCents: number;
  dueLabel: string | null;
  payHref?: string | null;
};

export type BalanceReminderOffset = 7 | 3 | 0;

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function sessionLine(model: BookingEmailModel) {
  const shooter = model.shooterName?.trim();
  if (!shooter) return model.experienceName;
  const lower = shooter.toLowerCase();
  if (lower === "anyone available" || lower === "surprise" || lower === "no preference") {
    return model.experienceName;
  }
  return `${model.experienceName} w/ ${firstName(shooter)}`;
}

function addressLines(location: string): string[] {
  const lines = location
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return lines;
  const last = lines[lines.length - 1] ?? "";
  const prev = lines[lines.length - 2] ?? "";
  if (/^\d{5}(?:-\d{4})?$/.test(last) && prev) {
    lines.splice(lines.length - 2, 2, `${prev} ${last}`);
  }
  return lines;
}

function locationSpec(model: BookingEmailModel): EmailSpec {
  if (model.locationIsStudio) {
    return { label: "Location", value: STUDIO_ADDRESS_HTML, html: true };
  }
  const lines = addressLines(model.location);
  if (lines.length <= 1) return { label: "Location", value: model.location };
  return {
    label: "Location",
    value: lines.map((line) => `<span style="display:block">${escapeHtml(line)}</span>`).join(""),
    html: true,
  };
}

function glanceSpecs(model: BookingEmailModel, part: 1 | 2 = 1): EmailSpec[] {
  const specs: EmailSpec[] = [
    { label: model.kind === "photobooth" ? "Experience" : "Session", value: sessionLine(model) },
    { label: "Date", value: model.eventDate },
    { label: "Time", value: model.eventTime },
    locationSpec(model),
    {
      label: "Total",
      value: formatPaidTotal({
        isDeposit: model.isDeposit || part === 2,
        paidCents: model.paidCents,
        balanceCents: model.balanceCents,
        part,
      }),
    },
  ];
  if ((model.isDeposit || part === 2) && model.balanceCents > 0) {
    specs.push({
      label: "Balance remaining",
      value: model.dueLabel
        ? `${formatCents(model.balanceCents)} due ${model.dueLabel}`
        : formatCents(model.balanceCents),
    });
  }
  return specs;
}

export function clientBookingEmail(model: BookingEmailModel) {
  const first = firstName(model.clientName);
  const headline = first.toLowerCase() === "there" ? "You're all set." : `You're all set, ${first}.`;
  const intro = model.isDeposit
    ? "Your date is held. The remaining balance is due before the event."
    : model.kind === "class"
      ? "Your seat is booked. Your receipt and class details are below."
      : model.kind === "studio"
        ? "Your session is booked. Your receipt and details are below."
        : "Your date is secured. Your receipt and event details are below.";

  return {
    id: model.isDeposit ? `${model.kind}-deposit` : `${model.kind}-paid`,
    audience: "client" as const,
    subject: `${model.experienceName} is booked`,
    html: renderStudioEmail({
      subject: `${model.experienceName} is booked`,
      preheader: headline,
      kicker: "Your booking",
      headline,
      intro,
      cardLabel: "Your session at a glance",
      specs: glanceSpecs(model),
    }),
  };
}

const REMINDER_COPY: Record<
  BalanceReminderOffset,
  { id: string; headline: string; intro: string; subjectLead: string }
> = {
  7: {
    id: "balance-7",
    headline: "Second payment in 7 days",
    intro: "The rest of your booking is due in a week. Pay whenever you're ready — the button below opens checkout for this booking.",
    subjectLead: "Remaining balance due in 7 days",
  },
  3: {
    id: "balance-3",
    headline: "Three days left to pay",
    intro: "The second half of your booking is due in three days. Use the button below to pay the remaining balance.",
    subjectLead: "Remaining balance due in 3 days",
  },
  0: {
    id: "balance-due",
    headline: "Balance due today",
    intro: "The second half of your booking is due today. Pay the remaining balance below to stay current.",
    subjectLead: "Remaining balance due today",
  },
};

export function balanceDueReminderEmail(model: BookingEmailModel, offset: BalanceReminderOffset) {
  const copy = REMINDER_COPY[offset];
  const payHref = model.payHref?.trim();
  const subject = `${copy.subjectLead} — ${model.experienceName}`;
  return {
    id: `${model.kind}-${copy.id}`,
    audience: "client" as const,
    subject,
    html: renderStudioEmail({
      subject,
      preheader: copy.headline,
      kicker: "Remaining balance",
      headline: copy.headline,
      intro: copy.intro,
      cardLabel: "Your session at a glance",
      specs: glanceSpecs(model, 2),
      ...(payHref ? { cta: { href: payHref, label: "Pay remaining" } } : {}),
    }),
  };
}

export function staffPaidEmail(model: BookingEmailModel) {
  const paidLabel = formatPaidTotal({
    isDeposit: model.isDeposit,
    paidCents: model.paidCents,
    balanceCents: model.balanceCents,
  });
  const intro = `${model.clientName} paid the ${model.isDeposit ? "deposit" : "balance in full"}.`;
  return {
    id: "staff-paid",
    audience: "staff" as const,
    subject: `${model.clientName} paid — ${model.experienceName}`,
    html: renderStudioEmail({
      subject: `${model.clientName} paid — ${model.experienceName}`,
      preheader: intro,
      kicker: "Paid",
      headline: "The date is locked in",
      intro,
      cardLabel: "Booking",
      specs: [
        { label: "Client", value: model.clientName },
        { label: "Session", value: sessionLine(model) },
        { label: "Date", value: model.eventDate },
        { label: "Total", value: paidLabel },
        { label: "Email", value: model.clientEmail },
      ],
    }),
  };
}

export const SAMPLE_PHOTOBOOTH: BookingEmailModel = {
  kind: "photobooth",
  clientName: "Camila Reyes",
  clientEmail: "camila.reyes@email.com",
  experienceName: "The Miami Classic",
  eventDate: "August 30, 2026",
  eventTime: "9:00 PM",
  location: "The Setai\n2001 Collins Ave\nMiami Beach, FL 33139",
  totalCents: 25000,
  paidCents: 12500,
  isDeposit: true,
  balanceCents: 12500,
  dueLabel: "August 23, 2026",
  payHref: "http://localhost:8080/pay-preview",
};

export const SAMPLE_STUDIO: BookingEmailModel = {
  kind: "studio",
  clientName: "Camila Reyes",
  clientEmail: "camila.reyes@email.com",
  experienceName: "Beauty Headshots",
  shooterName: "Seven",
  eventDate: "September 18, 2026",
  eventTime: "10:00 AM",
  location: "Studio 7 Miami",
  locationIsStudio: true,
  totalCents: 22500,
  paidCents: 22500,
  isDeposit: false,
  balanceCents: 0,
  dueLabel: null,
};

export const SAMPLE_CLASS: BookingEmailModel = {
  kind: "class",
  clientName: "Camila Reyes",
  clientEmail: "camila.reyes@email.com",
  experienceName: "Acting Class",
  eventDate: "September 12, 2026",
  eventTime: "2:00 PM",
  location: "Studio 7 Miami",
  locationIsStudio: true,
  totalCents: 5000,
  paidCents: 5000,
  isDeposit: false,
  balanceCents: 0,
  dueLabel: null,
};

export function allBookingEmailPreviews() {
  return [
    {
      ...clientBookingEmail(SAMPLE_PHOTOBOOTH),
      note: "Photobooth · deposit to the guest",
    },
    {
      ...clientBookingEmail({ ...SAMPLE_PHOTOBOOTH, isDeposit: false, paidCents: 25000, balanceCents: 0, dueLabel: null }),
      id: "photobooth-paid",
      note: "Photobooth · paid in full to the guest",
    },
    {
      ...clientBookingEmail(SAMPLE_STUDIO),
      note: "Studio session · paid to the guest",
    },
    {
      ...clientBookingEmail(SAMPLE_CLASS),
      note: "Acting class · paid to the guest",
    },
    {
      ...staffPaidEmail(SAMPLE_PHOTOBOOTH),
      note: "Staff · payment received",
    },
    {
      ...balanceDueReminderEmail(SAMPLE_PHOTOBOOTH, 7),
      note: "2nd payment · 7 days out",
    },
    {
      ...balanceDueReminderEmail(SAMPLE_PHOTOBOOTH, 3),
      note: "2nd payment · 3 days out",
    },
    {
      ...balanceDueReminderEmail(SAMPLE_PHOTOBOOTH, 0),
      note: "2nd payment · due today",
    },
  ];
}
