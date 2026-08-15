import {
  BOOKING_TIMEZONE,
  BREAKDOWN_HOURS,
  MAX_RENTALS_PER_DAY,
  SETUP_HOURS,
  TIME_SLOTS,
} from "@/config/booking-rules";
import type { ExperienceKey } from "@/config/pricing";

export type Occupancy = {
  /** Luxe or an all-day Google hold — the kit is gone for every date in `dates`. */
  exclusive: boolean;
  startMs: number;
  endMs: number;
  dates: string[];
};

export function ymdInZone(date: Date, timeZone = BOOKING_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

function offsetMsAt(utcMs: number, timeZone: string): number {
  const name =
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
      hour: "numeric",
    })
      .formatToParts(new Date(utcMs))
      .find((part) => part.type === "timeZoneName")?.value ?? "";
  const match = name.match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) {
    if (name.includes("DT")) return -4 * 3_600_000;
    return -5 * 3_600_000;
  }
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0)) * 60 * 1000;
}

/** Interpret a wall-clock date+time in `timeZone` as UTC milliseconds. */
export function wallTimeToUtcMs(
  date: string,
  time: string,
  timeZone = BOOKING_TIMEZONE,
): number {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const asIfUtc = Date.UTC(year, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0, 0);
  const first = asIfUtc - offsetMsAt(asIfUtc, timeZone);
  return asIfUtc - offsetMsAt(first, timeZone);
}

export function datesCovered(startMs: number, endMs: number, timeZone = BOOKING_TIMEZONE): string[] {
  if (!(endMs > startMs)) return [];
  const first = ymdInZone(new Date(startMs), timeZone);
  const last = ymdInZone(new Date(endMs - 1), timeZone);
  const dates: string[] = [];
  for (let cursor = first; cursor <= last; ) {
    dates.push(cursor);
    const [year, month, day] = cursor.split("-").map(Number);
    cursor = new Date(Date.UTC(year, (month ?? 1) - 1, (day ?? 1) + 1)).toISOString().slice(0, 10);
  }
  return dates;
}

export function occupancyFromWindow(args: {
  startMs: number;
  endMs: number;
  exclusive?: boolean;
}): Occupancy | null {
  if (!(args.endMs > args.startMs)) return null;
  const dates = datesCovered(args.startMs, args.endMs);
  if (dates.length === 0) return null;
  return {
    exclusive: Boolean(args.exclusive),
    startMs: args.startMs,
    endMs: args.endMs,
    dates,
  };
}

export function occupancyOnDate(items: Occupancy[], date: string): Occupancy[] {
  return items.filter((item) => item.dates.includes(date));
}

function padMs(hours: number): number {
  return hours * 60 * 60 * 1000;
}

/**
 * Kit on site from one hour before start through one hour after end.
 * Two bookings fit only when those windows do not overlap.
 */
export function windowFits(startMs: number, endMs: number, holds: Occupancy[]): boolean {
  if (!(endMs > startMs)) return false;
  const setup = padMs(SETUP_HOURS);
  const breakdown = padMs(BREAKDOWN_HOURS);
  const nextStart = startMs - setup;
  const nextEnd = endMs + breakdown;
  return holds.every((hold) => {
    if (hold.exclusive) return false;
    const holdStart = hold.startMs - setup;
    const holdEnd = hold.endMs + breakdown;
    return nextEnd <= holdStart || holdEnd <= nextStart;
  });
}

export function isDateClosed(
  items: Occupancy[],
  date: string,
  args: { experience: ExperienceKey; durationHours: number },
): boolean {
  const holds = occupancyOnDate(items, date);
  if (holds.some((hold) => hold.exclusive)) return true;
  if (holds.length >= MAX_RENTALS_PER_DAY) return true;
  if (args.experience === "luxe" && holds.length > 0) return true;
  return !TIME_SLOTS.some((slot) => isSlotOpen(items, date, slot, args));
}

export function isSlotOpen(
  items: Occupancy[],
  date: string,
  startTime: string,
  args: { experience: ExperienceKey; durationHours: number },
): boolean {
  const holds = occupancyOnDate(items, date);
  if (holds.some((hold) => hold.exclusive)) return false;
  if (holds.length >= MAX_RENTALS_PER_DAY) return false;
  if (args.experience === "luxe" && holds.length > 0) return false;
  const startMs = wallTimeToUtcMs(date, startTime);
  const endMs = startMs + args.durationHours * 60 * 60 * 1000;
  return windowFits(startMs, endMs, holds);
}

export const SLOT_UNAVAILABLE_MESSAGE =
  "That time isn't available. Another Photobooth hold is too close, or the day is full.";
