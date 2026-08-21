/** Mount path with no trailing slash. The app owns the domain root. */
export const PUBLIC_BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

export function publicUrl(path = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (!PUBLIC_BASE) return suffix;
  if (suffix === "/") return `${PUBLIC_BASE}/`;
  return `${PUBLIC_BASE}${suffix}`;
}
