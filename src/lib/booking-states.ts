export type BookingStatus =
  | "draft"
  | "pending_agreement"
  | "agreement_signed"
  | "deposit_paid"
  | "paid_in_full"
  | "confirmed"
  | "balance_due"
  | "settled"
  | "completed"
  | "cancelled"
  | "expired";

/** Allowed transitions. Payment states are only reachable after signing. */
const ALLOWED: Record<BookingStatus, BookingStatus[]> = {
  draft: ["pending_agreement", "cancelled", "expired"],
  pending_agreement: ["agreement_signed", "cancelled", "expired"],
  agreement_signed: ["deposit_paid", "paid_in_full", "cancelled", "expired"],
  deposit_paid: ["confirmed", "cancelled"],
  paid_in_full: ["confirmed", "cancelled"],
  confirmed: ["balance_due", "settled", "completed", "cancelled"],
  balance_due: ["settled", "cancelled"],
  settled: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  expired: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal booking transition: ${from} → ${to}`);
  }
}

/** Payment may only begin once the agreement has been signed. */
export function canStartPayment(status: BookingStatus): boolean {
  return status === "agreement_signed";
}

/** Remaining balance may be collected after the deposit has confirmed. */
export function canStartBalancePayment(status: BookingStatus): boolean {
  return status === "deposit_paid" || status === "confirmed" || status === "balance_due";
}
