/** Readable message from Error, PostgREST, or TanStack server-fn wrappers. */
export function errorMessage(error: unknown, fallback = ""): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error && typeof error === "object") {
    const rec = error as { message?: unknown; details?: unknown; data?: unknown };
    if (typeof rec.message === "string" && rec.message.trim()) return rec.message.trim();
    if (typeof rec.details === "string" && rec.details.trim()) return rec.details.trim();
    if (rec.data !== undefined) return errorMessage(rec.data, fallback);
  }
  return fallback;
}
