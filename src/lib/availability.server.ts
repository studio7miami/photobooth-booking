import { EXPERIENCES, type ExperienceKey } from "@/config/pricing";
import { CONFIRMED_STATUSES } from "@/config/booking-rules";
import {
  isSlotOpen,
  occupancyFromWindow,
  wallTimeToUtcMs,
  SLOT_UNAVAILABLE_MESSAGE,
  type Occupancy,
} from "./availability";
import { getAdmin, transitionBooking } from "./booking.server";
import { holdCutoffIso, isHoldActive } from "./hold";

function hhmm(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  return raw.slice(0, 5);
}

type OccupancyRow = {
  id?: string;
  event_date: string | null;
  event_start_time: string | null;
  duration_hours: number | null;
  experience: string | null;
  status?: string | null;
  signed_at?: string | null;
};

function rowToOccupancy(row: OccupancyRow): Occupancy | null {
  const date = row.event_date;
  if (!date) return null;
  const experience = (row.experience as ExperienceKey | null) ?? "classic";
  const exclusive = experience === "luxe";
  const startTime = hhmm(row.event_start_time);
  const duration = Number(row.duration_hours) || EXPERIENCES[experience]?.baseHours || 2;

  if (!startTime) {
    const startMs = wallTimeToUtcMs(date, "00:00");
    const endMs = wallTimeToUtcMs(date, "00:00") + 24 * 60 * 60 * 1000;
    return occupancyFromWindow({ startMs, endMs, exclusive: true });
  }

  const startMs = wallTimeToUtcMs(date, startTime);
  const endMs = startMs + duration * 60 * 60 * 1000;
  return occupancyFromWindow({ startMs, endMs, exclusive });
}

export async function expireStaleHolds(): Promise<void> {
  try {
    const supabase = await getAdmin();
    const cutoff = holdCutoffIso();
    const [{ data: timedOut }, { data: unsigned }] = await Promise.all([
      supabase.from("bookings").select("id").eq("status", "agreement_signed").lt("signed_at", cutoff),
      supabase.from("bookings").select("id").eq("status", "agreement_signed").is("signed_at", null),
    ]);

    const ids = [...(timedOut ?? []), ...(unsigned ?? [])].map((row) => String((row as { id: string }).id));
    for (const bookingId of ids) {
      await transitionBooking({
        bookingId,
        from: "agreement_signed",
        to: "expired",
        actor: "system",
        meta: { reason: "hold_expired" },
      });
    }
  } catch (error) {
    console.error("[availability] Failed to expire stale holds", error);
  }
}

/** Drop an unpaid hold when the guest's session resets (idle or hold timer). */
export async function releaseUnsignedHold(bookingId: string): Promise<void> {
  try {
    await transitionBooking({
      bookingId,
      from: "agreement_signed",
      to: "expired",
      actor: "client",
      meta: { reason: "session_reset" },
    });
  } catch (error) {
    console.error("[availability] Failed to release hold", error);
  }
}

async function listBookingOccupancy(excludeBookingId?: string): Promise<Occupancy[]> {
  try {
    await expireStaleHolds();
    const supabase = await getAdmin();
    const cutoff = holdCutoffIso();
    const select =
      "id, event_date, event_start_time, duration_hours, experience, status, signed_at";
    const [{ data: confirmed }, { data: holds, error }] = await Promise.all([
      supabase
        .from("bookings")
        .select(select)
        .eq("product", "photobooth")
        .not("event_date", "is", null)
        .in("status", [...CONFIRMED_STATUSES]),
      supabase
        .from("bookings")
        .select(select)
        .eq("product", "photobooth")
        .not("event_date", "is", null)
        .eq("status", "agreement_signed")
        .gte("signed_at", cutoff),
    ]);

    if (error) return [];

    const out: Occupancy[] = [];
    for (const raw of [...(confirmed ?? []), ...(holds ?? [])]) {
      const row = raw as OccupancyRow;
      if (excludeBookingId && row.id === excludeBookingId) continue;
      if (row.status === "agreement_signed" && !isHoldActive(row.signed_at)) continue;
      const occupancy = rowToOccupancy(row);
      if (occupancy) out.push(occupancy);
    }
    return out;
  } catch {
    return [];
  }
}

export async function listOccupancy(args?: { excludeBookingId?: string }): Promise<Occupancy[]> {
  const fromBookings = await listBookingOccupancy(args?.excludeBookingId);
  let fromGoogle: Occupancy[] = [];
  try {
    const { listGoogleOccupancy } = await import("./google-calendar.server");
    fromGoogle = await listGoogleOccupancy();
  } catch (error) {
    console.error("[availability] Google Calendar lookup failed", error);
  }
  return [...fromBookings, ...fromGoogle];
}

export async function assertSlotAvailable(args: {
  eventDate: string;
  eventStartTime: string;
  durationHours: number;
  experience: ExperienceKey;
  excludeBookingId?: string;
}): Promise<void> {
  const items = await listOccupancy(
    args.excludeBookingId ? { excludeBookingId: args.excludeBookingId } : undefined,
  );
  if (
    !isSlotOpen(items, args.eventDate, args.eventStartTime, {
      experience: args.experience,
      durationHours: args.durationHours,
    })
  ) {
    throw new Error(SLOT_UNAVAILABLE_MESSAGE);
  }
}
