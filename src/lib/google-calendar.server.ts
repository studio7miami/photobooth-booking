import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { BOOKING_TIMEZONE, MIN_CALENDAR_HOLD_HOURS } from "@/config/booking-rules";
import { occupancyFromWindow, wallTimeToUtcMs, type Occupancy } from "./availability";

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

type TokenCache = { accessToken: string; expiresAt: number };
let tokenCache: TokenCache | null = null;
let credentials: ServiceAccount | null | undefined;

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

type CalendarEventTime = { date?: string; dateTime?: string; timeZone?: string };
type CalendarEvent = {
  id?: string;
  status?: string;
  transparency?: string;
  start?: CalendarEventTime;
  end?: CalendarEventTime;
  extendedProperties?: { private?: Record<string, string> };
};

const BOOKING_EVENT_KEY = "studio7_booking_id";

function hhmm(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  return raw.slice(0, 5);
}

/** Calendar event ids may only use 0-9, a-v, and hyphen. */
export function googleEventIdForBooking(bookingId: string): string {
  return `s7pb${bookingId.replace(/-/g, "").toLowerCase()}`;
}

function isOwnBookingEvent(event: CalendarEvent): boolean {
  if (event.extendedProperties?.private?.[BOOKING_EVENT_KEY]) return true;
  return Boolean(event.id?.startsWith("s7pb") || event.id?.startsWith("s7st"));
}

function calendarTimezone(): string {
  return process.env["GOOGLE_CALENDAR_TIMEZONE"]?.trim() || BOOKING_TIMEZONE;
}

function parseAccount(parsed: Partial<ServiceAccount>): ServiceAccount | null {
  if (!parsed.client_email || !parsed.private_key) return null;
  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key.replace(/\\n/g, "\n"),
  };
}

function loadCredentials(): ServiceAccount | null {
  if (credentials !== undefined) return credentials;

  const inline = process.env["GOOGLE_SERVICE_ACCOUNT_JSON"]?.trim();
  if (inline) {
    try {
      const parsed = parseAccount(JSON.parse(inline) as Partial<ServiceAccount>);
      credentials = parsed;
      if (parsed) return parsed;
    } catch (error) {
      console.error("[google-calendar] GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON", error);
    }
  }

  const relative = process.env["GOOGLE_SERVICE_ACCOUNT_FILE"]?.trim();
  if (!relative) {
    credentials = null;
    return null;
  }
  try {
    const filePath = isAbsolute(relative) ? relative : resolve(process.cwd(), relative);
    const parsed = parseAccount(
      JSON.parse(readFileSync(filePath, "utf8")) as Partial<ServiceAccount>,
    );
    credentials = parsed;
    if (!parsed) {
      console.error(
        "[google-calendar] service account JSON is missing client_email or private_key",
      );
    }
    return parsed;
  } catch (error) {
    console.error("[google-calendar] failed to read service account file", error);
    credentials = null;
    return null;
  }
}

function signServiceAccountJwt(account: ServiceAccount): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: account.client_email,
      scope: CALENDAR_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  return `${unsigned}.${signer.sign(account.private_key, "base64url")}`;
}

async function getAccessToken(): Promise<string | null> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken;
  }
  const account = loadCredentials();
  if (!account) return null;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: signServiceAccountJwt(account),
  });
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    const text = await response.text();
    console.error(`[google-calendar] token exchange failed [${response.status}]: ${text}`);
    return null;
  }
  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  tokenCache = {
    accessToken: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return json.access_token;
}

function occupancyFromEvent(
  event: CalendarEvent,
  timeZone: string,
  minHoldHours = MIN_CALENDAR_HOLD_HOURS,
): Occupancy | null {
  const start = event.start;
  const end = event.end;
  if (!start || !end) return null;

  if (start.date && end.date) {
    const startMs = wallTimeToUtcMs(start.date, "00:00", timeZone);
    const endMs = wallTimeToUtcMs(end.date, "00:00", timeZone);
    return occupancyFromWindow({ startMs, endMs, exclusive: true });
  }

  if (start.dateTime && end.dateTime) {
    const startMs = new Date(start.dateTime).getTime();
    let endMs = new Date(end.dateTime).getTime();
    if (minHoldHours > 0) {
      const minEnd = startMs + minHoldHours * 60 * 60 * 1000;
      if (endMs < minEnd) endMs = minEnd;
    }
    return occupancyFromWindow({ startMs, endMs, exclusive: false });
  }

  return null;
}

export type CalendarKind = "photobooth" | "studio_photo" | "studio_acting";

function calendarIdFor(kind: CalendarKind = "photobooth"): string | null {
  if (kind === "studio_photo") return process.env["GOOGLE_CALENDAR_ID_STUDIO"]?.trim() || null;
  if (kind === "studio_acting") return process.env["GOOGLE_CALENDAR_ID_ACTING"]?.trim() || null;
  return process.env["GOOGLE_CALENDAR_ID"]?.trim() || null;
}

async function listCalendarEvents(kind: CalendarKind = "photobooth"): Promise<CalendarEvent[]> {
  const id = calendarIdFor(kind);
  const token = await getAccessToken();
  if (!id || !token) {
    if (!id && kind === "photobooth") {
      console.error("[google-calendar] GOOGLE_CALENDAR_ID is not set");
    }
    if (!token) {
      console.error(
        "[google-calendar] could not mint an access token — restart the dev server after adding .env keys",
      );
    }
    return [];
  }

  const timeZone = calendarTimezone();
  const timeMin = new Date();
  const timeMax = new Date();
  timeMax.setUTCMonth(timeMax.getUTCMonth() + 18);

  const events: CalendarEvent[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) {
      const text = await response.text();
      console.error(`[google-calendar] events.list failed [${response.status}]: ${text}`);
      return events;
    }

    const json = (await response.json()) as { items?: CalendarEvent[]; nextPageToken?: string };
    for (const event of json.items ?? []) {
      if (event.status === "cancelled") continue;
      events.push(event);
    }
    pageToken = json.nextPageToken;
  } while (pageToken);

  return events;
}

/** Photobooth Google Calendar holds, including Free and all-day events. */
export async function listGoogleOccupancy(): Promise<Occupancy[]> {
  return occupancyFromCalendar("photobooth", MIN_CALENDAR_HOLD_HOURS);
}

export async function listStudioPhotoGoogleOccupancy(): Promise<Occupancy[]> {
  return occupancyFromCalendar("studio_photo", 0);
}

export async function listActingGoogleOccupancy(): Promise<Occupancy[]> {
  return occupancyFromCalendar("studio_acting", 0);
}

async function occupancyFromCalendar(
  kind: CalendarKind,
  minHoldHours: number,
): Promise<Occupancy[]> {
  const timeZone = calendarTimezone();
  const events = await listCalendarEvents(kind);
  const out: Occupancy[] = [];
  for (const event of events) {
    if (isOwnBookingEvent(event)) continue;
    const occupancy = occupancyFromEvent(event, timeZone, minHoldHours);
    if (occupancy) out.push(occupancy);
  }
  return out;
}

export type PaidBookingCalendarInput = {
  id: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  event_location: string | null;
  event_type: string | null;
  event_date: string | null;
  event_start_time: string | null;
  duration_hours: number | null;
  duration_minutes?: number | null;
  experience: string | null;
  payment_mode: string | null;
  product?: string | null;
  resource?: string | null;
  shooter_name?: string | null;
};

function packageLabel(experience: string | null): string {
  if (experience === "social") return "The Miami Social";
  if (experience === "luxe") return "The Miami Luxe";
  if (experience === "classic") return "The Miami Classic";
  if (experience === "framehaus") return "Digitals + Comp Cards w/ Framehaus Media";
  if (experience === "portraits") return "Portraits";
  if (experience === "sports_media") return "Sports Media";
  if (experience === "beauty") return "Beauty Headshots";
  if (experience === "theatrical") return "Theatrical Headshots";
  if (experience === "headshot") return "Standard Headshots";
  if (experience === "passport") return "Passport Photos";
  if (experience === "photo_studio") return "Photo Studio Rental";
  if (experience === "full_studio") return "Full Studio Rental";
  if (experience === "acting_cj") return "Acting Class w/ CJ";
  return experience ? "Studio session" : "Photobooth";
}

function pad2(value: string | undefined): string {
  return (value ?? "00").padStart(2, "0");
}

function eventIdFor(booking: PaidBookingCalendarInput): string {
  const prefix = booking.product === "studio" ? "s7st" : "s7pb";
  return `${prefix}${booking.id.replace(/-/g, "").toLowerCase()}`;
}

/**
 * Writes the booked window onto the matching calendar after payment.
 * Acting class seats are not written (the class already exists on CJ's calendar).
 * Photobooth setup/breakdown stay in availability math — they are not added
 * to the event so occupancy is not padded twice.
 */
export async function upsertPaidBookingEvent(
  booking: PaidBookingCalendarInput,
): Promise<{ eventId: string; created: boolean } | null> {
  if (booking.resource === "studio_acting" || booking.experience === "acting_cj") {
    return null;
  }

  const kind: CalendarKind = booking.product === "studio" ? "studio_photo" : "photobooth";
  const id = calendarIdFor(kind);
  const token = await getAccessToken();
  const date = booking.event_date?.trim();
  const startTime = hhmm(booking.event_start_time);
  if (!id || !token || !date || !startTime) {
    if (!id || !token) {
      console.error("[google-calendar] cannot write booking — calendar id or token missing");
    }
    return null;
  }

  const durationMinutes =
    Number(booking.duration_minutes) ||
    (Number(booking.duration_hours)
      ? Number(booking.duration_hours) * 60
      : kind === "studio_photo"
        ? 90
        : 120);
  const timeZone = calendarTimezone();
  const startMs = wallTimeToUtcMs(date, startTime, timeZone);
  const endMs = startMs + durationMinutes * 60 * 1000;
  const endDate = new Date(endMs);
  const endWall = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(endDate);
  const endHour = endWall.find((part) => part.type === "hour")?.value ?? "00";
  const endMinute = endWall.find((part) => part.type === "minute")?.value ?? "00";
  const endYmd = new Intl.DateTimeFormat("en-CA", { timeZone }).format(endDate);
  const pkg = packageLabel(booking.experience);
  const who = booking.client_name?.trim() || "Client";
  const eventId = eventIdFor(booking);
  const durationLabel =
    durationMinutes < 60
      ? `${durationMinutes} min`
      : `${Math.round((durationMinutes / 60) * 10) / 10} hour${durationMinutes === 60 ? "" : "s"}`;
  const prefix = kind === "studio_photo" ? "Studio" : "Photobooth";

  const lines = [
    `${pkg} · ${durationLabel}`,
    `Client: ${who}`,
    booking.client_email ? `Email: ${booking.client_email}` : null,
    booking.client_phone ? `Phone: ${booking.client_phone}` : null,
    booking.event_type ? `Event: ${booking.event_type}` : null,
    booking.shooter_name ? `Shooter: ${booking.shooter_name}` : null,
    booking.payment_mode === "deposit" ? "Payment: deposit" : "Payment: paid in full",
    `Booking ID: ${booking.id}`,
  ].filter(Boolean);

  const body = {
    id: eventId,
    summary: `${prefix} · ${pkg} · ${who}`,
    description: lines.join("\n"),
    location: booking.event_location?.trim() || undefined,
    start: { dateTime: `${date}T${startTime}:00`, timeZone },
    end: { dateTime: `${endYmd}T${pad2(endHour)}:${pad2(endMinute)}:00`, timeZone },
    transparency: "opaque",
    status: "confirmed",
    extendedProperties: {
      private: { [BOOKING_EVENT_KEY]: booking.id },
    },
  };

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events?sendUpdates=none`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (response.ok) {
    const created = (await response.json()) as { id?: string };
    return { eventId: created.id ?? eventId, created: true };
  }

  if (response.status === 409) {
    return { eventId, created: false };
  }

  const text = await response.text();
  console.error(`[google-calendar] events.insert failed [${response.status}]: ${text}`);
  return null;
}
