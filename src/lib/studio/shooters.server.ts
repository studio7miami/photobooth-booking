import { createClient } from "@supabase/supabase-js";

import { CONFIRMED_STATUSES } from "@/config/booking-rules";
import { PHOTO_BUFFER_MINUTES } from "@/config/studio/booking-rules";
import { STUDIO_OFFERINGS, type StudioOfferingKey } from "@/config/studio/offerings";
import { occupancyFromWindow, wallTimeToUtcMs } from "@/lib/availability";
import { getAdmin } from "@/lib/booking.server";
import { holdCutoffIso, isHoldActive } from "@/lib/hold";
import {
  isSurpriseShooter,
  shooterInitials,
  shooterNameKey,
  SHOOTER_UNAVAILABLE_MESSAGE,
  type BookableShooter,
  type BookableShooterList,
} from "./shooters";

export type ShooterSlot = {
  eventDate: string;
  eventStartTime: string;
  durationMinutes: number;
  excludeBookingId?: string | undefined;
};

function text(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function mapRow(row: Record<string, unknown>): BookableShooter | null {
  const id = text(row, ["id", "user_id", "uuid"]);
  const name = text(row, ["full_name", "display_name", "name", "fullName"]);
  if (!id || !name) return null;
  return {
    id,
    name,
    initials: shooterInitials(name),
    portfolioUrl: text(row, [
      "portfolio_url",
      "portfolio",
      "website",
      "work_url",
      "instagram_url",
      "instagram",
    ]),
    avatarUrl: text(row, ["avatar_url", "photo_url", "image_url", "avatar", "headshot_url"]),
  };
}

function teamClient() {
  const url = process.env["TEAM_SUPABASE_URL"]?.trim();
  const key =
    process.env["TEAM_SUPABASE_SERVICE_ROLE_KEY"]?.trim() ||
    process.env["TEAM_SUPABASE_PUBLISHABLE_KEY"]?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function hhmm(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  return raw.slice(0, 5);
}

type OccupancyRow = {
  id?: string;
  event_date: string | null;
  event_start_time: string | null;
  duration_minutes: number | null;
  duration_hours: number | null;
  experience: string | null;
  status?: string | null;
  signed_at?: string | null;
  shooter_id?: string | null;
  shooter_name?: string | null;
};

function rowOccupancy(row: OccupancyRow) {
  const date = row.event_date;
  if (!date) return null;
  const startTime = hhmm(row.event_start_time);
  const offering =
    row.experience && row.experience in STUDIO_OFFERINGS
      ? STUDIO_OFFERINGS[row.experience as StudioOfferingKey]
      : null;
  const duration =
    Number(row.duration_minutes) ||
    offering?.baseMinutes ||
    (Number(row.duration_hours) ? Number(row.duration_hours) * 60 : 90);

  if (!startTime) {
    const startMs = wallTimeToUtcMs(date, "00:00");
    const endMs = startMs + 24 * 60 * 60 * 1000;
    return occupancyFromWindow({ startMs, endMs, exclusive: true });
  }

  const startMs = wallTimeToUtcMs(date, startTime);
  const endMs = startMs + duration * 60 * 1000;
  return occupancyFromWindow({ startMs, endMs, exclusive: false });
}

function overlapsSlot(row: OccupancyRow, slot: ShooterSlot): boolean {
  const hold = rowOccupancy(row);
  if (!hold) return false;
  const startMs = wallTimeToUtcMs(slot.eventDate, slot.eventStartTime);
  const endMs = startMs + slot.durationMinutes * 60 * 1000;
  const pad = PHOTO_BUFFER_MINUTES * 60 * 1000;
  if (hold.exclusive && hold.dates.includes(slot.eventDate)) return true;
  return startMs < hold.endMs + pad && endMs + pad > hold.startMs;
}

async function listBusyShooters(
  slot: ShooterSlot,
): Promise<{ ids: Set<string>; names: Set<string> }> {
  const ids = new Set<string>();
  const names = new Set<string>();
  try {
    const { expireStaleHolds } = await import("@/lib/availability.server");
    await expireStaleHolds();
    const supabase = await getAdmin();
    const cutoff = holdCutoffIso();
    const select =
      "id, event_date, event_start_time, duration_minutes, duration_hours, experience, status, signed_at, shooter_id, shooter_name";
    const [{ data: confirmed, error: confirmedError }, { data: holds, error: holdError }] =
      await Promise.all([
        supabase
          .from("bookings")
          .select(select)
          .eq("product", "studio")
          .eq("event_date", slot.eventDate)
          .not("shooter_id", "is", null)
          .in("status", [...CONFIRMED_STATUSES]),
        supabase
          .from("bookings")
          .select(select)
          .eq("product", "studio")
          .eq("event_date", slot.eventDate)
          .not("shooter_id", "is", null)
          .eq("status", "agreement_signed")
          .gte("signed_at", cutoff),
      ]);

    if (confirmedError || holdError) {
      console.error(
        "[shooters] could not read busy bookings",
        confirmedError?.message ?? holdError?.message,
      );
      return { ids, names };
    }

    for (const raw of [...(confirmed ?? []), ...(holds ?? [])]) {
      const row = raw as OccupancyRow;
      if (slot.excludeBookingId && row.id === slot.excludeBookingId) continue;
      if (row.status === "agreement_signed" && !isHoldActive(row.signed_at)) continue;
      const shooterId = row.shooter_id?.trim();
      if (!shooterId || isSurpriseShooter(shooterId)) continue;
      if (!overlapsSlot(row, slot)) continue;
      ids.add(shooterId);
      const name = row.shooter_name?.trim();
      if (name) names.add(shooterNameKey(name));
    }
  } catch (error) {
    console.error("[shooters] busy lookup failed", error);
  }
  return { ids, names };
}

async function listDirectory(): Promise<BookableShooter[]> {
  const supabase = teamClient();
  if (!supabase) {
    console.warn("[shooters] TEAM_SUPABASE_URL / key not set — no directory to load");
    return [];
  }

  const table = process.env["TEAM_SUPABASE_USERS_TABLE"]?.trim() || "users";
  const { data, error } = await supabase.from(table).select("*").eq("bookable", true);

  if (error) {
    console.error(`[shooters] could not read ${table}`, error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => mapRow(row as Record<string, unknown>))
    .filter((row): row is BookableShooter => Boolean(row))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listBookableShooters(slot: ShooterSlot): Promise<BookableShooterList> {
  const directory = await listDirectory();
  const busy = await listBusyShooters(slot);
  const shooters = directory.filter((shooter) => {
    if (busy.ids.has(shooter.id)) return false;
    if (busy.names.has(shooterNameKey(shooter.name))) return false;
    return true;
  });
  return { shooters, directoryCount: directory.length };
}

export async function assertShooterAvailable(
  args: ShooterSlot & { shooterId: string },
): Promise<void> {
  if (isSurpriseShooter(args.shooterId)) return;
  const { shooters } = await listBookableShooters(args);
  if (!shooters.some((shooter) => shooter.id === args.shooterId)) {
    throw new Error(SHOOTER_UNAVAILABLE_MESSAGE);
  }
}
