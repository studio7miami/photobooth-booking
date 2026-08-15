import type { BookingStatus } from "./booking-states";
import { assertTransition } from "./booking-states";

export async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function logBookingEvent(args: {
  bookingId: string;
  from: BookingStatus | null;
  to: BookingStatus;
  actor: string;
  meta?: Record<string, unknown>;
}) {
  const supabase = await getAdmin();
  await supabase.from("booking_events").insert({
    booking_id: args.bookingId,
    from_state: args.from,
    to_state: args.to,
    actor: args.actor,
    meta: (args.meta ?? {}) as never,
  });
}

/**
 * Single guarded path for every status change. Payment can't start before
 * the agreement is signed; `confirmed` requires signature + payment.
 */
export async function transitionBooking(args: {
  bookingId: string;
  from: BookingStatus;
  to: BookingStatus;
  actor: string;
  patch?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}) {
  assertTransition(args.from, args.to);
  const supabase = await getAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .update({ ...(args.patch ?? {}), status: args.to } as never)
    .eq("id", args.bookingId)
    .eq("status", args.from)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  // No row updated → another process already moved it on (idempotent replay).
  if (!data) return false;

  await logBookingEvent({
    bookingId: args.bookingId,
    from: args.from,
    to: args.to,
    actor: args.actor,
    ...(args.meta ? { meta: args.meta } : {}),
  });
  return true;
}
