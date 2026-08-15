import { HOLD_MINUTES } from "@/config/booking-rules";

export function holdExpiresAt(signedAt: string): Date {
  return new Date(new Date(signedAt).getTime() + HOLD_MINUTES * 60 * 1000);
}

export function isHoldActive(signedAt: string | null | undefined, now = Date.now()): boolean {
  if (!signedAt) return false;
  return holdExpiresAt(signedAt).getTime() > now;
}

export function holdCutoffIso(now = Date.now()): string {
  return new Date(now - HOLD_MINUTES * 60 * 1000).toISOString();
}
