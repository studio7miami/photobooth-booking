/** One photobooth kit. Rules for public rental availability. */
export const KIT_COUNT = 1;
export const MAX_RENTALS_PER_DAY = 2;
/** Empty kit time required between the end of one rental and the start of the next. */
export const BUFFER_HOURS = 3;
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
