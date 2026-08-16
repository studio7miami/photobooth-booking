import { INACTIVITY_MINUTES } from "@/config/booking-rules";
import type { BookingDraft } from "./booking-schema";

/**
 * Local draft persistence so a client can leave and resume where they
 * left off — but only within the inactivity window. After that the flow
 * starts over and any unpaid hold is released.
 */
const STORAGE_KEY = "studio7.booking.draft.v1";
const DRAFT_TTL_MS = INACTIVITY_MINUTES * 60 * 1000;

export type StoredSigned = {
  booking_id: string;
  total_cents: number;
  signed_at: string;
  agreement_template_version: string;
  agreement_content_hash: string;
  deposit_cents: number;
  balance_cents: number;
  balance_due_date: string;
};

export type StoredDraft = {
  /** Server booking id once a draft row exists; local token until then. */
  resumeToken: string;
  step: number;
  values: BookingDraft;
  updatedAt: string;
  signed?: StoredSigned | null;
};

function makeToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readStoredDraft(): StoredDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed || typeof parsed !== "object" || !parsed.values) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isDraftFresh(draft: StoredDraft, now = Date.now()): boolean {
  const updated = Date.parse(draft.updatedAt);
  if (!Number.isFinite(updated)) return false;
  return now - updated < DRAFT_TTL_MS;
}

export function loadDraft(): StoredDraft | null {
  const parsed = readStoredDraft();
  if (!parsed) return null;
  if (!isDraftFresh(parsed)) {
    clearDraft();
    return null;
  }
  return parsed;
}

/** Keep an in-progress session from looking stale while the guest is still here. */
export function touchDraft(): void {
  const draft = readStoredDraft();
  if (!draft) return;
  saveDraft(draft.step, draft.values, { resumeToken: draft.resumeToken, signed: draft.signed });
}

export function saveDraft(
  step: number,
  values: BookingDraft,
  extra?: { resumeToken?: string; signed?: StoredSigned | null },
): StoredDraft {
  const previous = readStoredDraft();
  const draft: StoredDraft = {
    resumeToken: extra?.resumeToken ?? previous?.resumeToken ?? makeToken(),
    step,
    values,
    updatedAt: new Date().toISOString(),
    signed: extra && "signed" in extra ? extra.signed : previous?.signed ?? null,
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* storage unavailable — the flow still works, just without resume */
    }
  }
  return draft;
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
