/**
 * Display normalizers. Raw input is stored as entered; these functions
 * produce the canonical presentation used in summaries, the agreement,
 * and the executed PDF.
 */

const LOWER_WORDS = new Set(["of", "and", "the", "at", "in", "on", "for", "to", "de", "la"]);

function titleCaseWord(word: string, index: number): string {
  const lower = word.toLowerCase();
  if (index > 0 && LOWER_WORDS.has(lower)) return lower;
  // Handle hyphenated and apostrophed names: jean-luc → Jean-Luc, o'brien → O'Brien
  return lower.replace(/(^|[-'’])([a-z0-9])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

export function titleCase(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return trimmed.split(" ").map(titleCaseWord).join(" ");
}

export function formatName(input: string): string {
  return titleCase(input);
}

export function formatEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    const d = digits.slice(1);
    return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return input.trim();
}

/** Live US phone mask: (000) 999-9999 */
export function formatPhoneInput(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const US_STATES = new Set([
  "al","ak","az","ar","ca","co","ct","de","fl","ga","hi","id","il","in","ia","ks","ky","la","me",
  "md","ma","mi","mn","ms","mo","mt","ne","nv","nh","nj","nm","ny","nc","nd","oh","ok","or","pa",
  "ri","sc","sd","tn","tx","ut","vt","va","wa","wv","wi","wy","dc","pr",
]);

function formatAddressToken(token: string): string {
  const bare = token.trim();
  if (!bare) return "";
  if (/^\d+(-\d+)?$/.test(bare)) return bare; // street numbers, ZIP
  if (/^\d{5}(-\d{4})?$/.test(bare)) return bare;
  if (US_STATES.has(bare.toLowerCase()) || /^florida$/i.test(bare)) {
    return /^florida$/i.test(bare) ? "FL" : bare.toUpperCase();
  }
  if (/^(usa|us|ne|nw|se|sw|po)$/i.test(bare)) return bare.toUpperCase();
  return titleCase(bare);
}

function formatAddressPart(part: string): string {
  return part
    .trim()
    .split(" ")
    .map(formatAddressToken)
    .filter(Boolean)
    .join(" ");
}

function formatCommaAddress(input: string): string {
  return input
    .split(",")
    .map(formatAddressPart)
    .filter(Boolean)
    .join(", ");
}

/** `Name — street, city, ST ZIP` from venue autocomplete. Left side is a street if it starts with a number. */
function splitBusinessPrefix(input: string): { name: string; rest: string } | null {
  for (const sep of [" — ", " – ", " - "]) {
    const at = input.indexOf(sep);
    if (at <= 0) continue;
    const name = input.slice(0, at).trim();
    const rest = input.slice(at + sep.length).trim();
    if (!name || !rest || /^\d/.test(name)) return null;
    return { name, rest };
  }
  return null;
}

function peelCityStateZip(commaParts: string[]): { street: string; cityLine: string } | null {
  const parts = commaParts.map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  let zip = "";
  let state = "";

  const last = parts[parts.length - 1] ?? "";
  if (/^\d{5}(?:-\d{4})?$/.test(last)) {
    zip = last;
    parts.pop();
  } else {
    const mixed = last.match(/^(.+?)\s+(\d{5}(?:-\d{4})?)$/);
    if (mixed) {
      const maybeState = mixed[1]?.trim() ?? "";
      if (US_STATES.has(maybeState.toLowerCase()) || /^florida$/i.test(maybeState)) {
        state = /^florida$/i.test(maybeState) ? "FL" : maybeState.toUpperCase();
        zip = mixed[2] ?? "";
        parts.pop();
      }
    }
  }

  if (!state && parts.length) {
    const maybeState = parts[parts.length - 1] ?? "";
    if (US_STATES.has(maybeState.toLowerCase()) || /^florida$/i.test(maybeState)) {
      state = /^florida$/i.test(maybeState) ? "FL" : maybeState.toUpperCase();
      parts.pop();
    }
  }

  const city = parts.pop()?.trim() ?? "";
  if (!city || !state) return null;

  const cityLine = zip
    ? `${formatAddressPart(city)}, ${state} ${zip}`
    : `${formatAddressPart(city)}, ${state}`;
  return { street: parts.map(formatAddressPart).join(", "), cityLine };
}

/** Business venues as three lines: name / street / city, ST ZIP. Street-only addresses stay one line. */
export function formatAddressLines(input: string): string[] {
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (!trimmed) return [];

  const business = splitBusinessPrefix(trimmed);
  if (business) {
    const peeled = peelCityStateZip(business.rest.split(","));
    if (peeled) {
      return [
        formatAddressPart(business.name),
        ...(peeled.street ? [peeled.street] : []),
        peeled.cityLine,
      ];
    }
    return [formatAddressPart(business.name), formatCommaAddress(business.rest)];
  }

  return [formatCommaAddress(trimmed)];
}

export function formatAddress(input: string): string {
  return formatAddressLines(input).join(", ");
}

export function formatEventType(input: string): string {
  return titleCase(input.replace(/[_-]+/g, " "));
}
