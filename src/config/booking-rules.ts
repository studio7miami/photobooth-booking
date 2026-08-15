/** One photobooth kit. Rules for public rental availability. */
export const KIT_COUNT = 1;
export const MAX_RENTALS_PER_DAY = 2;
/** Load-in before the booked start. */
export const SETUP_HOURS = 1;
/** Unload after the booked end. */
export const BREAKDOWN_HOURS = 1;
/**
 * Timed Google Calendar events shorter than a Classic rental still occupy
 * a full kit window, so a 5:00 PM meeting is treated as 5:00–7:00.
 */
export const MIN_CALENDAR_HOLD_HOURS = 2;
export const BOOKING_TIMEZONE = "America/New_York";

/** Unpaid signatures hold the slot this long. After that the time opens again. */
export const HOLD_MINUTES = 10;

/** Paid (signed + paid) rows keep the slot. Unpaid signatures are a timed hold. */
export const CONFIRMED_STATUSES = [
  "deposit_paid",
  "paid_in_full",
  "confirmed",
  "balance_due",
  "settled",
  "completed",
] as const;

/** Start times offered in the booking flow, Eastern. */
export const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const total = 20 + i;
  const h = `${Math.floor(total / 2)}`.padStart(2, "0");
  const m = total % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});
