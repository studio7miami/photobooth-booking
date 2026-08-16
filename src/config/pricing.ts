/**
 * Studio 7 Miami — pricing configuration.
 *
 * Single source of truth for experiences and pricing. Used by both the
 * client-side live preview and the server-side recompute so the two can
 * never drift. Edit here; never hardcode prices in components.
 *
 * All money is integer cents, USD.
 */

export const EXPERIENCE_KEYS = ["classic", "social", "luxe"] as const;
export type ExperienceKey = (typeof EXPERIENCE_KEYS)[number];

export type Experience = {
  key: ExperienceKey;
  name: string;
  guests: string;
  tagline: string;
  baseCents: number;
  baseHours: number;
  additionalHourCents: number;
  /** Luxe is priced per station; the total multiplies by station count. */
  perStation: boolean;
  /** Signature is quoted, not self-serve priced. */
  custom?: boolean;
  /** One-sentence positioning line shown on the experience card. */
  description: string;
  /** Short duration line for the card metadata row. */
  durationLabel: string;
  /** Starting price line for the card metadata row. */
  priceLabel: string;
  inclusions: string[];
};

export const EXPERIENCES: Record<ExperienceKey, Experience> = {
  classic: {
    key: "classic",
    name: "The Miami Classic",
    guests: "Up to 50 guests",
    tagline: "The essential booth. Clean, fast, unforgettable.",
    description: "For intimate celebrations, birthdays, and close-circle events.",
    durationLabel: "2 hours",
    priceLabel: "$250 for 2 hours",
    baseCents: 25000,
    baseHours: 2,
    additionalHourCents: 10000,
    perStation: false,
    inclusions: [
      "2 hours of booth time",
      "On-site attendant",
      "Unlimited digital captures",
      "Instant text & email delivery",
      "Curated prop styling",
      "Standard backdrop",
    ],
  },
  social: {
    key: "social",
    name: "The Miami Social",
    guests: "51–200 guests",
    tagline: "Built for a full room and a long night.",
    description: "For weddings, corporate events, and celebrations with a full room.",
    durationLabel: "3 hours",
    priceLabel: "$500 for 3 hours",
    baseCents: 50000,
    baseHours: 3,
    additionalHourCents: 15000,
    perStation: false,
    inclusions: [
      "3 hours of booth time",
      "On-site attendant",
      "Unlimited digital captures",
      "Custom overlay & start screen",
      "Premium backdrop selection",
      "Online gallery after the event",
    ],
  },
  luxe: {
    key: "luxe",
    name: "The Miami Luxe",
    guests: "200+ guests",
    tagline: "Multi-station production for large-format events.",
    description: "For galas, brand activations, productions, and large-scale moments.",
    durationLabel: "5 hours per station",
    priceLabel: "$1,500 per station for 5 hours",
    baseCents: 150000,
    baseHours: 5,
    additionalHourCents: 20000,
    perStation: true,
    inclusions: [
      "5 hours of booth time per station",
      "Dedicated attendant per station",
      "Full custom branding & templates",
      "On-site printing",
      "Designer backdrop & lighting package",
      "Same-night gallery delivery",
    ],
  },
};

export const EXPERIENCE_LIST: Experience[] = EXPERIENCE_KEYS.map((k) => EXPERIENCES[k]);

export const EVENT_TYPES = [
  { value: "wedding", label: "Wedding" },
  { value: "birthday", label: "Birthday" },
  { value: "corporate", label: "Corporate" },
  { value: "activation", label: "Activation" },
  { value: "other", label: "Other" },
] as const;

export type EventTypeValue = (typeof EVENT_TYPES)[number]["value"];

export const DEPOSIT_PERCENT = 50;
/** Balance is due this many days before the event date. */
export const BALANCE_DUE_DAYS_BEFORE_EVENT = 7;
/** Events this close (or closer) cannot take a deposit — pay in full. */
export const REQUIRE_FULL_PAYMENT_WITHIN_DAYS = 3;
export const CURRENCY = "usd";

export type PriceInput = {
  experience: ExperienceKey;
  durationHours: number;
  stationCount?: number | null;
};

export type PriceBreakdown = {
  experience: ExperienceKey;
  baseCents: number;
  baseHours: number;
  addlHours: number;
  addlRateCents: number;
  addlCents: number;
  stationCount: number;
  perStation: boolean;
  /** Price for a single station (base + additional hours). */
  perStationCents: number;
  totalCents: number;
  depositCents: number;
  balanceCents: number;
};

/**
 * Total = base + (additional hours x tier rate), multiplied by station
 * count for Luxe. Deposit is 50% of the total; balance is the remainder.
 */
export function calculatePrice(input: PriceInput): PriceBreakdown {
  const tier = EXPERIENCES[input.experience];
  const stationCount = tier.perStation ? Math.max(1, Math.floor(input.stationCount ?? 1)) : 1;
  const duration = Math.max(tier.baseHours, Math.floor(input.durationHours || tier.baseHours));
  const addlHours = duration - tier.baseHours;
  const addlCents = addlHours * tier.additionalHourCents;
  const perStationCents = tier.baseCents + addlCents;
  const totalCents = perStationCents * stationCount;
  const depositCents = Math.round((totalCents * DEPOSIT_PERCENT) / 100);

  return {
    experience: tier.key,
    baseCents: tier.baseCents,
    baseHours: tier.baseHours,
    addlHours,
    addlRateCents: tier.additionalHourCents,
    addlCents,
    stationCount,
    perStation: tier.perStation,
    perStationCents,
    totalCents,
    depositCents,
    balanceCents: totalCents - depositCents,
  };
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Event date (YYYY-MM-DD) minus 7 days, as YYYY-MM-DD. */
export function balanceDueDate(eventDate: string): string {
  const d = new Date(`${eventDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - BALANCE_DUE_DAYS_BEFORE_EVENT);
  return d.toISOString().slice(0, 10);
}
