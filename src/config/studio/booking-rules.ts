import { BOOKING_TIMEZONE } from "@/config/booking-rules";

export { BOOKING_TIMEZONE };

/** Gap left after a photo session so the next guest isn't stacked on load-out. */
export const PHOTO_BUFFER_MINUTES = 15;

/** Studio photo hours, Eastern. Inclusive start; last start depends on duration. */
export const PHOTO_HOURS_START = "10:00";
export const PHOTO_HOURS_END = "19:00";

/** 15-minute start times from 10:00 through 18:45. */
export const PHOTO_TIME_SLOTS: string[] = Array.from({ length: 36 }, (_, i) => {
  const total = 10 * 60 + i * 15;
  const h = `${Math.floor(total / 60)}`.padStart(2, "0");
  const m = `${total % 60}`.padStart(2, "0");
  return `${h}:${m}`;
});

export const ACTING_CAPACITY = 8;
export const ACTING_HORIZON_WEEKS = 8;

/**
 * Recurring group class windows. `weekday` is JS getDay() in Eastern
 * (0 Sunday … 6 Saturday). Edit here when CJ's schedule changes.
 */
export const ACTING_WEEKLY: readonly { weekday: number; startTime: string }[] = [
  { weekday: 6, startTime: "14:00" },
];

export const STUDIO_LOCATION_NAME = "Studio 7 Miami";
export const STUDIO_LOCATION_ADDRESS = "638 NW 62nd St, Miami, FL 33150";
export const STUDIO_LOCATION = `${STUDIO_LOCATION_NAME} — ${STUDIO_LOCATION_ADDRESS}`;
