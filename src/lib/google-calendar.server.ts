import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { BOOKING_TIMEZONE } from "@/config/booking-rules";
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

type CalendarEventTime = { date?: string; dateTime?: string };
type CalendarEvent = {
  status?: string;
  transparency?: string;
  start?: CalendarEventTime;
  end?: CalendarEventTime;
};

function calendarId(): string | null {
  const id = process.env["GOOGLE_CALENDAR_ID"]?.trim();
  return id || null;
}

function calendarTimezone(): string {
  return process.env["GOOGLE_CALENDAR_TIMEZONE"]?.trim() || BOOKING_TIMEZONE;
}

function loadCredentials(): ServiceAccount | null {
  if (credentials !== undefined) return credentials;
  const relative = process.env["GOOGLE_SERVICE_ACCOUNT_FILE"]?.trim();
  if (!relative) {
    credentials = null;
    return null;
  }
  try {
    const filePath = isAbsolute(relative) ? relative : resolve(process.cwd(), relative);
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as Partial<ServiceAccount>;
    if (!parsed.client_email || !parsed.private_key) {
      console.error("[google-calendar] service account JSON is missing client_email or private_key");
      credentials = null;
      return null;
    }
    credentials = { client_email: parsed.client_email, private_key: parsed.private_key };
    return credentials;
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

function occupancyFromEvent(event: CalendarEvent, timeZone: string): Occupancy | null {
  const start = event.start;
  const end = event.end;
  if (!start || !end) return null;

  if (start.date && end.date) {
    const startMs = wallTimeToUtcMs(start.date, "00:00", timeZone);
    const endMs = wallTimeToUtcMs(end.date, "00:00", timeZone);
    return occupancyFromWindow({ startMs, endMs, exclusive: true });
  }

  if (start.dateTime && end.dateTime) {
    // Timed events marked Free (inquiries, notes) do not hold the kit.
    // All-day events still do — those are studio/kit-out days.
    if (event.transparency === "transparent") return null;
    const startMs = new Date(start.dateTime).getTime();
    const endMs = new Date(end.dateTime).getTime();
    return occupancyFromWindow({ startMs, endMs, exclusive: false });
  }

  return null;
}

async function listCalendarEvents(): Promise<CalendarEvent[]> {
  const id = calendarId();
  const token = await getAccessToken();
  if (!id || !token) {
    if (!id) console.error("[google-calendar] GOOGLE_CALENDAR_ID is not set");
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
  const timeZone = calendarTimezone();
  const events = await listCalendarEvents();
  const out: Occupancy[] = [];
  for (const event of events) {
    const occupancy = occupancyFromEvent(event, timeZone);
    if (occupancy) out.push(occupancy);
  }
  return out;
}
