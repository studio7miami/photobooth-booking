import { INACTIVITY_MINUTES } from "@/config/booking-rules";
import type { StudioBookingDraft } from "./booking-schema";
import type { StoredSigned } from "@/lib/booking-draft";

export type { StoredSigned };

const STORAGE_KEY = "studio7.studio.draft.v1";
const DRAFT_TTL_MS = INACTIVITY_MINUTES * 60 * 1000;

export type StoredStudioDraft = {
  resumeToken: string;
  step: number;
  values: StudioBookingDraft;
  updatedAt: string;
  signed?: StoredSigned | null;
};

function makeToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readStoredDraft(): StoredStudioDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredStudioDraft;
    if (!parsed || typeof parsed !== "object" || !parsed.values) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isStudioDraftFresh(draft: StoredStudioDraft, now = Date.now()): boolean {
  const updated = Date.parse(draft.updatedAt);
  if (!Number.isFinite(updated)) return false;
  return now - updated < DRAFT_TTL_MS;
}

export function loadStudioDraft(): StoredStudioDraft | null {
  const parsed = readStoredDraft();
  if (!parsed) return null;
  if (!isStudioDraftFresh(parsed)) {
    clearStudioDraft();
    return null;
  }
  return parsed;
}

export function touchStudioDraft(): void {
  const draft = readStoredDraft();
  if (!draft) return;
  saveStudioDraft(draft.step, draft.values, { resumeToken: draft.resumeToken, signed: draft.signed });
}

export function saveStudioDraft(
  step: number,
  values: StudioBookingDraft,
  extra?: { resumeToken?: string; signed?: StoredSigned | null },
): StoredStudioDraft {
  const previous = readStoredDraft();
  const draft: StoredStudioDraft = {
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
      /* storage unavailable */
    }
  }
  return draft;
}

export function clearStudioDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
