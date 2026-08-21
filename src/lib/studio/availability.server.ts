import { CONFIRMED_STATUSES } from "@/config/booking-rules";
import {
  ACTING_CAPACITY,
  ACTING_HORIZON_WEEKS,
  ACTING_WEEKLY,
  BOOKING_TIMEZONE,
} from "@/config/studio/booking-rules";
import { STUDIO_OFFERINGS, type StudioOfferingKey } from "@/config/studio/offerings";
import { occupancyFromWindow, wallTimeToUtcMs, ymdInZone, type Occupancy } from "@/lib/availability";
import { getAdmin, transitionBooking } from "@/lib/booking.server";
import { holdCutoffIso, isHoldActive } from "@/lib/hold";
import {
  CLASS_SEAT_UNAVAILABLE_MESSAGE,
  PHOTO_SLOT_UNAVAILABLE_MESSAGE,
  classSessionId,
  isPhotoSlotOpen,
  type ActingSession,
} from "./availability";

function hhmm(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  return raw.slice(0, 5);
}

type OccupancyRow = {
  id?: string;
  event_date: string | null;
  event_start_time: string | null;
  duration_minutes: number | null;
  duration_hours: number | null;
  experience: string | null;
  status?: string | null;
  signed_at?: string | null;
};

function rowToPhotoOccupancy(row: OccupancyRow): Occupancy | null {
  const date = row.event_date;
  if (!date) return null;
  const startTime = hhmm(row.event_start_time);
  const offering = row.experience && row.experience in STUDIO_OFFERINGS
    ? STUDIO_OFFERINGS[row.experience as StudioOfferingKey]
    : null;
  const duration =
    Number(row.duration_minutes) ||
    offering?.baseMinutes ||
    (Number(row.duration_hours) ? Number(row.duration_hours) * 60 : 90);

  if (!startTime) {
    const startMs = wallTimeToUtcMs(date, "00:00");
    const endMs = startMs + 24 * 60 * 60 * 1000;
    return occupancyFromWindow({ startMs, endMs, exclusive: true });
  }

  const startMs = wallTimeToUtcMs(date, startTime);
  const endMs = startMs + duration * 60 * 1000;
  return occupancyFromWindow({ startMs, endMs, exclusive: false });
}

async function listStudioPhotoBookingOccupancy(excludeBookingId?: string): Promise<Occupancy[]> {
  try {
    const { expireStaleHolds } = await import("@/lib/availability.server");
    await expireStaleHolds();
    const supabase = await getAdmin();
    const cutoff = holdCutoffIso();
    const select =
      "id, event_date, event_start_time, duration_minutes, duration_hours, experience, status, signed_at";
    const [{ data: confirmed }, { data: holds, error }] = await Promise.all([
      supabase
        .from("bookings")
        .select(select)
        .eq("product", "studio")
        .eq("resource", "studio_photo")
        .not("event_date", "is", null)
        .in("status", [...CONFIRMED_STATUSES]),
      supabase
        .from("bookings")
        .select(select)
        .eq("product", "studio")
        .eq("resource", "studio_photo")
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
      const occupancy = rowToPhotoOccupancy(row);
      if (occupancy) out.push(occupancy);
    }
    return out;
  } catch {
    return [];
  }
}

export async function listStudioPhotoOccupancy(args?: {
  excludeBookingId?: string;
}): Promise<Occupancy[]> {
  const fromBookings = await listStudioPhotoBookingOccupancy(args?.excludeBookingId);
  let fromGoogle: Occupancy[] = [];
  try {
    const { listStudioPhotoGoogleOccupancy } = await import("@/lib/google-calendar.server");
    fromGoogle = await listStudioPhotoGoogleOccupancy();
  } catch (error) {
    console.error("[studio-availability] Google Calendar lookup failed", error);
  }
  return [...fromBookings, ...fromGoogle];
}

export async function assertPhotoSlotAvailable(args: {
  eventDate: string;
  eventStartTime: string;
  durationMinutes: number;
  excludeBookingId?: string;
}): Promise<void> {
  const items = await listStudioPhotoOccupancy(
    args.excludeBookingId ? { excludeBookingId: args.excludeBookingId } : undefined,
  );
  if (!isPhotoSlotOpen(items, args.eventDate, args.eventStartTime, args.durationMinutes)) {
    throw new Error(PHOTO_SLOT_UNAVAILABLE_MESSAGE);
  }
}

function easternWeekday(date: string): number {
  const utc = wallTimeToUtcMs(date, "12:00", BOOKING_TIMEZONE);
  const weekdayName = new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIMEZONE,
    weekday: "short",
  }).format(new Date(utc));
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekdayName] ?? 0;
}

function addDaysYmd(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, (day ?? 1) + days)).toISOString().slice(0, 10);
}

function materializeActingDates(fromDate: string): { date: string; startTime: string }[] {
  const out: { date: string; startTime: string }[] = [];
  const last = addDaysYmd(fromDate, ACTING_HORIZON_WEEKS * 7);
  for (let cursor = fromDate; cursor <= last; cursor = addDaysYmd(cursor, 1)) {
    const weekday = easternWeekday(cursor);
    for (const weekly of ACTING_WEEKLY) {
      if (weekly.weekday === weekday) out.push({ date: cursor, startTime: weekly.startTime });
    }
  }
  return out;
}

function sessionOverlapsHold(
  date: string,
  startTime: string,
  durationMinutes: number,
  holds: Occupancy[],
): boolean {
  const startMs = wallTimeToUtcMs(date, startTime);
  const endMs = startMs + durationMinutes * 60 * 1000;
  return holds.some((hold) => {
    if (hold.exclusive && hold.dates.includes(date)) return true;
    return startMs < hold.endMs && endMs > hold.startMs;
  });
}

async function countActingSeats(
  sessionId: string,
  excludeBookingId?: string,
): Promise<number> {
  const supabase = await getAdmin();
  const cutoff = holdCutoffIso();
  const [{ data: confirmed }, { data: holds }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id")
      .eq("product", "studio")
      .eq("resource", "studio_acting")
      .eq("class_session_id", sessionId)
      .in("status", [...CONFIRMED_STATUSES]),
    supabase
      .from("bookings")
      .select("id, signed_at")
      .eq("product", "studio")
      .eq("resource", "studio_acting")
      .eq("class_session_id", sessionId)
      .eq("status", "agreement_signed")
      .gte("signed_at", cutoff),
  ]);

  let taken = (confirmed ?? []).length;
  for (const row of holds ?? []) {
    const hold = row as { id: string; signed_at: string | null };
    if (excludeBookingId && hold.id === excludeBookingId) continue;
    if (!isHoldActive(hold.signed_at)) continue;
    taken += 1;
  }
  if (excludeBookingId) {
    taken -= (confirmed ?? []).filter((row) => String((row as { id: string }).id) === excludeBookingId).length;
  }
  return taken;
}

export async function listActingSessions(args?: {
  excludeBookingId?: string;
}): Promise<ActingSession[]> {
  try {
    const { expireStaleHolds } = await import("@/lib/availability.server");
    await expireStaleHolds();
  } catch {
    /* occupancy still usable */
  }

  const tomorrow = addDaysYmd(ymdInZone(new Date(), BOOKING_TIMEZONE), 1);
  const dates = materializeActingDates(tomorrow);
  const durationMinutes = STUDIO_OFFERINGS.acting_cj.baseMinutes;

  let googleHolds: Occupancy[] = [];
  try {
    const { listActingGoogleOccupancy } = await import("@/lib/google-calendar.server");
    googleHolds = await listActingGoogleOccupancy();
  } catch (error) {
    console.error("[studio-availability] acting calendar lookup failed", error);
  }

  const sessions: ActingSession[] = [];
  for (const slot of dates) {
    if (sessionOverlapsHold(slot.date, slot.startTime, durationMinutes, googleHolds)) continue;
    const id = classSessionId(slot.date, slot.startTime);
    const taken = await countActingSeats(id, args?.excludeBookingId);
    const remaining = Math.max(0, ACTING_CAPACITY - taken);
    if (remaining <= 0) continue;
    sessions.push({
      id,
      date: slot.date,
      startTime: slot.startTime,
      durationMinutes,
      capacity: ACTING_CAPACITY,
      taken,
      remaining,
    });
  }
  return sessions;
}

export async function assertActingSeatAvailable(args: {
  classSessionId: string;
  eventDate: string;
  eventStartTime: string;
  excludeBookingId?: string;
}): Promise<void> {
  const sessions = await listActingSessions(
    args.excludeBookingId ? { excludeBookingId: args.excludeBookingId } : undefined,
  );
  const match = sessions.find((session) => session.id === args.classSessionId);
  if (!match || match.date !== args.eventDate || match.startTime !== args.eventStartTime) {
    throw new Error(CLASS_SEAT_UNAVAILABLE_MESSAGE);
  }
  if (match.remaining <= 0) throw new Error(CLASS_SEAT_UNAVAILABLE_MESSAGE);
}
