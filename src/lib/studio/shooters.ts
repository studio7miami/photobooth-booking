export const SURPRISE_SHOOTER_ID = "surprise";

export type BookableShooter = {
  id: string;
  name: string;
  initials: string;
  portfolioUrl: string | null;
  avatarUrl: string | null;
};

export const SURPRISE_SHOOTER: BookableShooter = {
  id: SURPRISE_SHOOTER_ID,
  name: "Anyone available",
  initials: "",
  portfolioUrl: null,
  avatarUrl: null,
};

export function shooterInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

export function isSurpriseShooter(id: string | undefined): boolean {
  return id === SURPRISE_SHOOTER_ID;
}

export type BookableShooterList = {
  shooters: BookableShooter[];
  directoryCount: number;
};

export const SHOOTER_UNAVAILABLE_MESSAGE =
  "That photographer isn't free at this time. Pick someone else, or choose another slot.";

export function shooterNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
