import { EXPERIENCES } from "@/config/pricing";
import { STUDIO_LOCATION } from "@/config/studio/booking-rules";
import { isStudioOfferingKey, STUDIO_OFFERINGS } from "@/config/studio/offerings";
import { canStartBalancePayment, type BookingStatus } from "@/lib/booking-states";
import { getAdmin, logBookingEvent, transitionBooking } from "@/lib/booking.server";
import {
  balanceDueReminderEmail,
  type BalanceReminderOffset,
  type BookingEmailKind,
  type BookingEmailModel,
} from "@/lib/email/booking-emails";
import { sendHtmlEmail } from "@/lib/email/send";
import { bookingPayUrl } from "@/lib/site-origin";

const CHANNEL: Record<BalanceReminderOffset, string> = {
  7: "balance_reminder_7",
  3: "balance_reminder_3",
  0: "balance_reminder_0",
};

type ReminderRow = {
  id: string;
  status: BookingStatus;
  payment_mode: string | null;
  amount_paid_cents: number;
  balance_cents: number | null;
  balance_due_date: string | null;
  balance_status: string | null;
  total_cents: number | null;
  experience: string | null;
  event_date: string | null;
  event_start_time: string | null;
  event_location: string | null;
  client_name: string | null;
  client_email: string | null;
  shooter_name?: string | null;
  resource?: string | null;
  confirmation_channels: string[] | null;
  balance_link: string | null;
};

function todayEastern(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

function daysUntil(date: string, today = todayEastern()): number {
  return Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000,
  );
}

function formatLongDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "America/New_York",
  }).format(new Date(`${date}T12:00:00Z`));
}

function formatTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  const hour = h ?? 0;
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${`${m ?? 0}`.padStart(2, "0")} ${suffix}`;
}

function kindFor(row: ReminderRow): BookingEmailKind {
  if (row.experience && row.experience in EXPERIENCES) return "photobooth";
  if (row.resource === "studio_acting") return "class";
  if (row.experience && isStudioOfferingKey(row.experience)) {
    return STUDIO_OFFERINGS[row.experience].resource === "studio_acting" ? "class" : "studio";
  }
  return "studio";
}

function experienceName(row: ReminderRow): string {
  if (row.experience && row.experience in EXPERIENCES) {
    return EXPERIENCES[row.experience as keyof typeof EXPERIENCES].name;
  }
  if (row.experience && isStudioOfferingKey(row.experience)) {
    return STUDIO_OFFERINGS[row.experience].name;
  }
  return "Studio 7 booking";
}

function emailModel(row: ReminderRow): BookingEmailModel | null {
  const email = row.client_email?.trim();
  if (!email || !row.event_date || !row.balance_due_date) return null;
  const location = row.event_location?.trim() || STUDIO_LOCATION;
  return {
    kind: kindFor(row),
    clientName: row.client_name?.trim() || "there",
    clientEmail: email,
    experienceName: experienceName(row),
    ...(row.shooter_name ? { shooterName: row.shooter_name } : {}),
    eventDate: formatLongDate(row.event_date),
    eventTime: row.event_start_time ? formatTime(row.event_start_time.slice(0, 5)) : "",
    location,
    locationIsStudio: location.startsWith("Studio 7 Miami"),
    totalCents: Number(row.total_cents ?? 0),
    paidCents: Number(row.amount_paid_cents ?? 0),
    isDeposit: true,
    balanceCents: Number(row.balance_cents ?? 0),
    dueLabel: formatLongDate(row.balance_due_date),
    payHref: bookingPayUrl(row.id),
  };
}

function dueOffset(daysUntilDue: number): BalanceReminderOffset | null {
  if (daysUntilDue === 7) return 7;
  if (daysUntilDue === 3) return 3;
  if (daysUntilDue <= 0) return 0;
  return null;
}

export async function runBalanceReminders(): Promise<{
  scanned: number;
  sent: number;
  skipped: number;
  errors: number;
}> {
  const supabase = await getAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, status, payment_mode, amount_paid_cents, balance_cents, balance_due_date, balance_status, balance_link, total_cents, experience, event_date, event_start_time, event_location, client_name, client_email, resource, confirmation_channels",
    )
    .in("status", ["deposit_paid", "confirmed", "balance_due"])
    .gt("balance_cents", 0)
    .not("balance_due_date", "is", null)
    .not("client_email", "is", null);

  if (error) throw error;
  const rows = (data ?? []) as unknown as ReminderRow[];
  const today = todayEastern();
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    if (row.balance_status === "paid") {
      skipped += 1;
      continue;
    }
    if (!canStartBalancePayment(row.status)) {
      skipped += 1;
      continue;
    }
    if (!row.balance_due_date) {
      skipped += 1;
      continue;
    }
    const offset = dueOffset(daysUntil(row.balance_due_date, today));
    if (offset === null) {
      skipped += 1;
      continue;
    }

    const channel = CHANNEL[offset];
    const channels = row.confirmation_channels ?? [];
    if (channels.includes(channel)) {
      skipped += 1;
      continue;
    }

    const model = emailModel(row);
    if (!model) {
      skipped += 1;
      continue;
    }

    const email = balanceDueReminderEmail(model, offset);
    const result = await sendHtmlEmail({
      to: model.clientEmail,
      subject: email.subject,
      html: email.html,
    });
    if (!result.ok) {
      errors += 1;
      console.error("[balance-reminders] send failed", row.id, result.error);
      continue;
    }

    sent += 1;
    const nextChannels = [...channels, channel];
    await supabase
      .from("bookings")
      .update({
        confirmation_channels: nextChannels,
        ...(row.balance_link ? {} : { balance_link: bookingPayUrl(row.id) }),
      } as never)
      .eq("id", row.id);

    await logBookingEvent({
      bookingId: row.id,
      from: row.status,
      to: row.status,
      actor: "system",
      meta: { reminder: channel, offset },
    });

    if (offset === 0 && row.status === "confirmed") {
      try {
        await transitionBooking({
          bookingId: row.id,
          from: "confirmed",
          to: "balance_due",
          actor: "system",
          meta: { reason: "balance_due_date" },
        });
      } catch (err) {
        console.error("[balance-reminders] status move failed", row.id, err);
      }
    }
  }

  return { scanned: rows.length, sent, skipped, errors };
}

export function cronAuthorized(request: Request): boolean {
  const secret = process.env["CRON_SECRET"]?.trim();
  const auth = request.headers.get("authorization") ?? "";
  if (secret && auth === `Bearer ${secret}`) return true;
  if (secret) {
    const url = new URL(request.url);
    if (url.searchParams.get("secret") === secret) return true;
  }
  if (request.headers.get("x-vercel-cron") === "1") return true;
  return false;
}
