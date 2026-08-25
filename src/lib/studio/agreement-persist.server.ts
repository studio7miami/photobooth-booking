import { STUDIO_LOCATION } from "@/config/studio/booking-rules";
import { calculateStudioPrice, STUDIO_OFFERINGS } from "@/config/studio/offerings";
import { balanceDueDate } from "@/config/pricing";
import { formatEmail } from "@/lib/format-display";
import type { SignatureRecord } from "@/lib/agreement.server";
import { expireStaleHolds } from "@/lib/availability.server";
import { getAdmin, logBookingEvent, transitionBooking } from "@/lib/booking.server";
import { isHoldActive } from "@/lib/hold";
import { classSessionId } from "./availability";
import { assertActingSeatAvailable, assertPhotoSlotAvailable } from "./availability.server";
import { assertShooterAvailable } from "./shooters.server";
import type { StudioBookingDetails } from "./booking-schema";

function hhmm(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  return raw.slice(0, 5);
}

async function findOpenHold(
  supabase: Awaited<ReturnType<typeof getAdmin>>,
  booking: StudioBookingDetails,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id, event_start_time, signed_at")
    .eq("product", "studio")
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

export async function persistStudioSignedBooking(
  booking: StudioBookingDetails,
  record: SignatureRecord,
): Promise<string> {
  if (STUDIO_OFFERINGS[booking.offering].resource === "studio_acting") {
    throw new Error("Acting class does not use a service agreement.");
  }

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

  const offering = STUDIO_OFFERINGS[booking.offering];
  const price = calculateStudioPrice({
    offering: booking.offering,
    durationMinutes: booking.durationMinutes,
  });

  await assertPhotoSlotAvailable({
    eventDate: booking.eventDate,
    eventStartTime: booking.eventStartTime,
    durationMinutes: price.totalMinutes,
  });

  if (offering.assignsShooter && booking.shooterId) {
    await assertShooterAvailable({
      shooterId: booking.shooterId,
      eventDate: booking.eventDate,
      eventStartTime: booking.eventStartTime,
      durationMinutes: price.totalMinutes,
    });
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      status: "agreement_signed",
      product: "studio",
      resource: offering.resource,
      client_name: booking.clientName,
      client_phone: booking.clientPhone,
      client_email: formatEmail(booking.clientEmail),
      client_notes: booking.clientNotes?.trim() || null,
      shooter_id: booking.shooterId?.trim() || null,
      shooter_name: booking.shooterName?.trim() || null,
      event_location: booking.eventLocation || STUDIO_LOCATION,
      event_type: offering.name,
      event_date: booking.eventDate,
      event_start_time: booking.eventStartTime,
      duration_minutes: price.totalMinutes,
      duration_hours: Math.max(1, Math.ceil(price.totalMinutes / 60)),
      class_session_id: null,
      experience: booking.offering,
      base_cents: price.baseCents,
      addl_hours: price.extraSlots,
      addl_rate_cents: price.extraRateCents,
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
    meta: { experience: booking.offering, total_cents: price.totalCents },
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

export async function persistStudioClassHold(booking: StudioBookingDetails): Promise<{
  booking_id: string;
  total_cents: number;
  deposit_cents: number;
  balance_cents: number;
  balance_due_date: string;
  signed_at: string;
}> {
  const offering = STUDIO_OFFERINGS[booking.offering];
  if (offering.resource !== "studio_acting") {
    throw new Error("This offering requires a signed agreement.");
  }

  const price = calculateStudioPrice({
    offering: booking.offering,
    durationMinutes: booking.durationMinutes,
  });
  const due = balanceDueDate(booking.eventDate);
  const sessionId =
    booking.classSessionId ?? classSessionId(booking.eventDate, booking.eventStartTime);

  const supabase = await getAdmin();
  await expireStaleHolds();
  const existingId = await findOpenHold(supabase, booking);
  await assertActingSeatAvailable({
    classSessionId: sessionId,
    eventDate: booking.eventDate,
    eventStartTime: booking.eventStartTime,
    ...(existingId ? { excludeBookingId: existingId } : {}),
  });

  const signedAt = new Date().toISOString();
  if (existingId) {
    await supabase
      .from("bookings")
      .update({
        signed_at: signedAt,
        client_name: booking.clientName,
        client_phone: booking.clientPhone,
        client_notes: booking.clientNotes?.trim() || null,
      } as never)
      .eq("id", existingId);
    await expireOtherHolds(supabase, formatEmail(booking.clientEmail), existingId);
    return {
      booking_id: existingId,
      total_cents: price.totalCents,
      deposit_cents: price.depositCents,
      balance_cents: price.balanceCents,
      balance_due_date: due,
      signed_at: signedAt,
    };
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      status: "agreement_signed",
      product: "studio",
      resource: offering.resource,
      client_name: booking.clientName,
      client_phone: booking.clientPhone,
      client_email: formatEmail(booking.clientEmail),
      client_notes: booking.clientNotes?.trim() || null,
      event_location: booking.eventLocation || STUDIO_LOCATION,
      event_type: offering.name,
      event_date: booking.eventDate,
      event_start_time: booking.eventStartTime,
      duration_minutes: price.totalMinutes,
      duration_hours: Math.max(1, Math.ceil(price.totalMinutes / 60)),
      class_session_id: sessionId,
      experience: booking.offering,
      base_cents: price.baseCents,
      addl_hours: price.extraSlots,
      addl_rate_cents: price.extraRateCents,
      total_cents: price.totalCents,
      currency: "usd",
      deposit_cents: price.depositCents,
      balance_cents: price.balanceCents,
      balance_due_date: due,
      agreement_signed: false,
      signer_name: booking.clientName,
      signed_at: signedAt,
      consent: true,
      marketing_opt_in: false,
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
    meta: { experience: booking.offering, total_cents: price.totalCents, class_hold: true },
  });
  await logBookingEvent({
    bookingId,
    from: "pending_agreement",
    to: "agreement_signed",
    actor: "client",
    meta: { class_hold: true },
  });

  return {
    booking_id: bookingId,
    total_cents: price.totalCents,
    deposit_cents: price.depositCents,
    balance_cents: price.balanceCents,
    balance_due_date: due,
    signed_at: signedAt,
  };
}
