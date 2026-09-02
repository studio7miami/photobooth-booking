/** Public origin for guest links in emails. */
export function bookingPublicOrigin(): string {
  const fromEnv =
    process.env["BOOKING_PUBLIC_ORIGIN"]?.trim() ||
    process.env["VITE_BOOKING_PUBLIC_ORIGIN"]?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "https://book.studio7.miami";
}

export function bookingPayPath(bookingId: string): string {
  return `/pay/${bookingId}`;
}

export function bookingPayUrl(bookingId: string, origin = bookingPublicOrigin()): string {
  return `${origin}${bookingPayPath(bookingId)}`;
}
