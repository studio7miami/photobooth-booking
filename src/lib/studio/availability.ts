import { wallTimeToUtcMs, occupancyFromWindow, occupancyOnDate, type Occupancy } from "@/lib/availability";
import {
  PHOTO_BUFFER_MINUTES,
  PHOTO_HOURS_END,
  PHOTO_TIME_SLOTS,
} from "@/config/studio/booking-rules";
import { STUDIO_OFFERINGS, type StudioOfferingKey } from "@/config/studio/offerings";

export { occupancyFromWindow, occupancyOnDate, wallTimeToUtcMs };
export type { Occupancy };

function bufferMs(minutes = PHOTO_BUFFER_MINUTES): number {
  return minutes * 60 * 1000;
}

export function photoWindowFits(
  startMs: number,
  endMs: number,
  holds: Occupancy[],
  padMinutes = PHOTO_BUFFER_MINUTES,
): boolean {
  if (!(endMs > startMs)) return false;
  const pad = bufferMs(padMinutes);
  const nextEnd = endMs + pad;
  return holds.every((hold) => {
    if (hold.exclusive) return false;
    const holdEnd = hold.endMs + pad;
    return nextEnd <= hold.startMs || holdEnd <= startMs;
  });
}

function hoursEndMs(date: string): number {
  return wallTimeToUtcMs(date, PHOTO_HOURS_END);
}

export function isPhotoSlotOpen(
  items: Occupancy[],
  date: string,
  startTime: string,
  durationMinutes: number,
): boolean {
  const holds = occupancyOnDate(items, date);
  if (holds.some((hold) => hold.exclusive)) return false;
  const startMs = wallTimeToUtcMs(date, startTime);
  const endMs = startMs + durationMinutes * 60 * 1000;
  if (endMs > hoursEndMs(date)) return false;
  return photoWindowFits(startMs, endMs, holds);
}

export function isPhotoDateClosed(
  items: Occupancy[],
  date: string,
  durationMinutes: number,
): boolean {
  const holds = occupancyOnDate(items, date);
  if (holds.some((hold) => hold.exclusive)) return true;
  return !PHOTO_TIME_SLOTS.some((slot) => isPhotoSlotOpen(items, date, slot, durationMinutes));
}

export function classSessionId(date: string, startTime: string): string {
  return `${date}_${startTime}`;
}

export function parseClassSessionId(id: string): { date: string; startTime: string } | null {
  const match = id.match(/^(\d{4}-\d{2}-\d{2})_(\d{2}:\d{2})$/);
  if (!match) return null;
  return { date: match[1]!, startTime: match[2]! };
}

export type ActingSession = {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
};

export const PHOTO_SLOT_UNAVAILABLE_MESSAGE =
  "That time isn't available. Another studio session is too close, or the day is full.";

export const CLASS_SEAT_UNAVAILABLE_MESSAGE =
  "That class isn't offered on that date. Pick another session.";

export function defaultDurationMinutes(offering: StudioOfferingKey): number {
  return STUDIO_OFFERINGS[offering].baseMinutes;
}
