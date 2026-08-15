/** One photobooth kit. Rules for public rental availability. */
export const KIT_COUNT = 1;
export const MAX_RENTALS_PER_DAY = 2;
/** Empty kit time required between the end of one rental and the start of the next. */
export const BUFFER_HOURS = 3;
export const BOOKING_TIMEZONE = "America/New_York";

/** Signed (and later) rows hold inventory. Unsigned drafts do not. */
export const HOLDING_STATUSES = [
  "agreement_signed",
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
