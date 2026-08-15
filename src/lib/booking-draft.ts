import type { BookingDraft } from "./booking-schema";

/**
 * Local draft persistence so a client can leave and resume where they
 * left off. Once the backend is connected this mirrors a `draft` booking
 * row; the resume token below becomes that booking's id.
 */
const STORAGE_KEY = "studio7.booking.draft.v1";

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

export function loadDraft(): StoredDraft | null {
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

export function saveDraft(
  step: number,
  values: BookingDraft,
  extra?: { resumeToken?: string; signed?: StoredSigned | null },
): StoredDraft {
  const previous = loadDraft();
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
