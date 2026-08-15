import { calculatePrice } from "@/config/pricing";
import { formatEmail } from "./format-display";
import type { BookingDetails } from "./booking-schema";
import type { SignatureRecord } from "./agreement.server";
import { assertSlotAvailable, expireStaleHolds } from "./availability.server";
import { getAdmin, logBookingEvent, transitionBooking } from "./booking.server";
import { isHoldActive } from "./hold";

function hhmm(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  return raw.slice(0, 5);
}

async function findOpenHold(
  supabase: Awaited<ReturnType<typeof getAdmin>>,
  booking: BookingDetails,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id, event_start_time, signed_at")
    .eq("event_date", booking.eventDate)
    .eq("status", "agreement_signed")
    .ilike("client_email", formatEmail(booking.clientEmail))
    .limit(10);

  if (error || !data) return null;
  const start = hhmm(booking.eventStartTime);
  const match = data.find(
    (row) =>
      hhmm(row.event_start_time as string | null) === start &&
      isHoldActive(row.signed_at as string | null),
  );
  return match ? String(match.id) : null;
}

async function expireOtherHolds(
  supabase: Awaited<ReturnType<typeof getAdmin>>,
  email: string,
  keepId: string,
) {
  const { data } = await supabase
    .from("bookings")
    .select("id")
    .eq("status", "agreement_signed")
    .ilike("client_email", email)
    .neq("id", keepId);
  for (const row of data ?? []) {
    await transitionBooking({
      bookingId: String((row as { id: string }).id),
      from: "agreement_signed",
      to: "expired",
      actor: "client",
      meta: { reason: "replaced_by_new_hold" },
    });
  }
}

/**
 * Writes the signed booking with server-recomputed pricing and the full
 * audit trail (draft → pending_agreement → agreement_signed).
 *
 * A refresh after sign must not create a second hold — the unpaid signature
 * for this email + slot is reused.
 */
export async function persistSignedBooking(
  booking: BookingDetails,
  record: SignatureRecord,
): Promise<string> {
  const supabase = await getAdmin();
  await expireStaleHolds();
  const existingId = await findOpenHold(supabase, booking);
  if (existingId) {
    await supabase
      .from("bookings")
      .update({
        signature_value: record.signature_value,
        signer_name: record.signer_name,
        signed_at: record.signed_at,
        signer_ip: record.signer_ip,
        signer_user_agent: record.signer_user_agent,
        marketing_opt_in: record.marketing_opt_in,
        agreement_content_hash: record.agreement_content_hash,
      } as never)
      .eq("id", existingId);
    await expireOtherHolds(supabase, formatEmail(booking.clientEmail), existingId);
    return existingId;
  }

  await assertSlotAvailable({
    eventDate: booking.eventDate,
    eventStartTime: booking.eventStartTime,
    durationHours: booking.durationHours,
    experience: booking.experience,
  });

  const price = calculatePrice({
    experience: booking.experience,
    durationHours: booking.durationHours,
    stationCount: booking.stationCount ?? 1,
  });

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      status: "agreement_signed",
      client_name: booking.clientName,
      client_phone: booking.clientPhone,
      client_email: formatEmail(booking.clientEmail),
      event_location: booking.eventLocation,
      event_type:
        booking.eventType === "other" && booking.eventTypeOther
          ? `Other — ${booking.eventTypeOther}`
          : booking.eventType,
      event_date: booking.eventDate,
      event_start_time: booking.eventStartTime,
      duration_hours: booking.durationHours,
      station_count: booking.stationCount ?? null,
      experience: booking.experience,
      base_cents: price.baseCents,
      addl_hours: price.addlHours,
      addl_rate_cents: price.addlRateCents,
      total_cents: price.totalCents,
      currency: "usd",
      deposit_cents: price.depositCents,
      balance_cents: price.balanceCents,
      balance_due_date: record.balance_due_date,
      agreement_template_version: record.agreement_template_version,
      agreement_content_hash: record.agreement_content_hash,
      agreement_signed: true,
      signature_value: record.signature_value,
      signer_name: record.signer_name,
      signed_at: record.signed_at,
      signer_ip: record.signer_ip,
      signer_user_agent: record.signer_user_agent,
      consent: true,
      marketing_opt_in: record.marketing_opt_in,
    } as never)
    .select("id")
    .single();

  if (error || !data) throw error ?? new Error("Could not save booking");
  const bookingId = (data as { id: string }).id;
  await expireOtherHolds(supabase, formatEmail(booking.clientEmail), bookingId);

  await logBookingEvent({
    bookingId,
    from: "draft",
    to: "pending_agreement",
    actor: "client",
    meta: { experience: booking.experience, total_cents: price.totalCents },
  });
  await logBookingEvent({
    bookingId,
    from: "pending_agreement",
    to: "agreement_signed",
    actor: "client",
    meta: record.event.meta,
  });

  return bookingId;
}
