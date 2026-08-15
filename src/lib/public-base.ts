/** Mount path with no trailing slash. Empty on localhost; `/photobooth` on Vercel. */
export const PUBLIC_BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

export function publicUrl(path = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (!PUBLIC_BASE) return suffix;
  if (suffix === "/") return `${PUBLIC_BASE}/`;
  return `${PUBLIC_BASE}${suffix}`;
}
