import { EXPERIENCES, type ExperienceKey } from "@/config/pricing";
import { HOLDING_STATUSES } from "@/config/booking-rules";
import {
  isSlotOpen,
  occupancyFromWindow,
  wallTimeToUtcMs,
  SLOT_UNAVAILABLE_MESSAGE,
  type Occupancy,
} from "./availability";
import { getAdmin } from "./booking.server";

function hhmm(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  return raw.slice(0, 5);
}

async function listBookingOccupancy(): Promise<Occupancy[]> {
  try {
    const supabase = await getAdmin();
    const { data, error } = await supabase
      .from("bookings")
      .select("event_date, event_start_time, duration_hours, experience")
      .not("event_date", "is", null)
      .in("status", [...HOLDING_STATUSES]);

    if (error || !data) return [];

    const out: Occupancy[] = [];
    for (const row of data) {
      const date = row.event_date as string | null;
      if (!date) continue;
      const experience = (row.experience as ExperienceKey | null) ?? "classic";
      const exclusive = experience === "luxe";
      const startTime = hhmm(row.event_start_time as string | null);
      const duration =
        Number(row.duration_hours) || EXPERIENCES[experience]?.baseHours || 2;

      if (!startTime) {
        const startMs = wallTimeToUtcMs(date, "00:00");
        const endMs = wallTimeToUtcMs(date, "00:00") + 24 * 60 * 60 * 1000;
        const occupancy = occupancyFromWindow({ startMs, endMs, exclusive: true });
        if (occupancy) out.push(occupancy);
        continue;
      }

      const startMs = wallTimeToUtcMs(date, startTime);
      const endMs = startMs + duration * 60 * 60 * 1000;
      const occupancy = occupancyFromWindow({ startMs, endMs, exclusive });
      if (occupancy) out.push(occupancy);
    }
    return out;
  } catch {
    return [];
  }
}

export async function listOccupancy(): Promise<Occupancy[]> {
  const fromBookings = await listBookingOccupancy();
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
}): Promise<void> {
  const items = await listOccupancy();
  if (
    !isSlotOpen(items, args.eventDate, args.eventStartTime, {
      experience: args.experience,
      durationHours: args.durationHours,
    })
  ) {
    throw new Error(SLOT_UNAVAILABLE_MESSAGE);
  }
}
