/**
 * Studio 7 Miami — in-studio session and rental catalog.
 *
 * Separate from photobooth rental pricing. Amounts are integer cents, USD.
 * Extra time is billed in `extraStepMinutes` steps when `additionalSlotCents` is set.
 */

import { DEPOSIT_PERCENT, formatCents } from "@/config/pricing";

export { formatCents };

export const STUDIO_OFFERING_KEYS = [
  "full_studio",
  "photo_studio",
  "portraits",
  "sports_media",
  "beauty",
  "theatrical",
  "headshot",
  "passport",
  "framehaus",
  "acting_cj",
] as const;

export type StudioOfferingKey = (typeof STUDIO_OFFERING_KEYS)[number];

export type StudioResource = "studio_photo" | "studio_acting";

export type StudioOffering = {
  key: StudioOfferingKey;
  name: string;
  tagline: string;
  description: string;
  durationLabel: string;
  priceLabel: string;
  group: "photography" | "rentals" | "class";
  resource: StudioResource;
  baseCents: number;
  baseMinutes: number;
  /**
   * Extra-step price. `0` hides the extra-time stepper until a rate is set.
   * Hourly rentals use the same amount as `baseCents` with a 60-minute step.
   */
  additionalSlotCents: number;
  /** Minutes added per stepper click. Defaults to 30. */
  extraStepMinutes?: number;
  /** Cap on extra steps. Defaults to `MAX_EXTRA_SLOTS`. */
  maxExtraSlots?: number;
  allowsExtraTime: boolean;
  depositEligible: boolean;
  inclusions: string[];
  /** Guest picks a bookable team photographer for this session. */
  assignsShooter?: boolean;
};

export const STUDIO_OFFERINGS: Record<StudioOfferingKey, StudioOffering> = {
  framehaus: {
    key: "framehaus",
    name: "Digitals + Comp Cards w/ Framehaus Media",
    tagline: "Digitals & comp cards, shot as you are.",
    description:
      "For models targeting agencies and casting calls that want to see you as you are. Shot in a studio, this session delivers the industry-standard photos and walk footage that agencies, show curators, and casting directors need — clean, unfiltered, and ready to submit.",
    durationLabel: "90 min session",
    priceLabel: "Starting at $165",
    group: "class",
    resource: "studio_photo",
    baseCents: 16500,
    baseMinutes: 90,
    additionalSlotCents: 0,
    allowsExtraTime: true,
    depositEligible: false,
    inclusions: [
      "90-minute studio session",
      "Industry-standard digitals",
      "Comp-card frames",
      "Walk footage for your book",
    ],
  },
  portraits: {
    key: "portraits",
    name: "Portraits",
    tagline: "Images that actually feel like you.",
    description:
      "Explore, experiment, and walk away with images that actually feel like you. Perfect for personal branding, editorial use, or simply investing in yourself.",
    durationLabel: "90 min session",
    priceLabel: "Starting at $250",
    group: "photography",
    resource: "studio_photo",
    baseCents: 25000,
    baseMinutes: 90,
    additionalSlotCents: 0,
    allowsExtraTime: true,
    depositEligible: true,
    assignsShooter: true,
    inclusions: [
      "90-minute portrait session",
      "Directed posing and lighting",
      "Edited gallery",
      "Personal, editorial, or brand use",
    ],
  },
  beauty: {
    key: "beauty",
    name: "Beauty Headshots",
    tagline: "Your presence, elevated.",
    description:
      "Designed for talent, creatives, and professionals who lead with their image — two polished looks and a gallery built to make an impression. Shot in 90 minutes, delivered with care.",
    durationLabel: "90 min session",
    priceLabel: "Starting at $225",
    group: "photography",
    resource: "studio_photo",
    baseCents: 22500,
    baseMinutes: 90,
    additionalSlotCents: 0,
    allowsExtraTime: true,
    depositEligible: true,
    inclusions: ["90-minute session", "Two polished looks", "Beauty lighting", "Edited gallery"],
  },
  theatrical: {
    key: "theatrical",
    name: "Theatrical Headshots",
    tagline: "Built for the performer.",
    description:
      "Two styled looks crafted for casting calls and creative submissions that need to show your range. A 90-minute session to capture every side of your story.",
    durationLabel: "90 min session",
    priceLabel: "Starting at $165",
    group: "photography",
    resource: "studio_photo",
    baseCents: 16500,
    baseMinutes: 90,
    additionalSlotCents: 0,
    allowsExtraTime: true,
    depositEligible: false,
    inclusions: [
      "90-minute session",
      "Two styled looks",
      "Range for casting submissions",
      "Edited gallery",
    ],
  },
  headshot: {
    key: "headshot",
    name: "Standard Headshots",
    tagline: "Clean. Confident. Professional.",
    description:
      "Shot on a white backdrop for a timeless look that works across LinkedIn, press kits, and beyond. Everything you need, nothing you don't.",
    durationLabel: "30 min session",
    priceLabel: "Starting at $150",
    group: "photography",
    resource: "studio_photo",
    baseCents: 15000,
    baseMinutes: 30,
    additionalSlotCents: 0,
    allowsExtraTime: true,
    depositEligible: false,
    inclusions: [
      "30-minute session",
      "White-backdrop headshots",
      "LinkedIn and press-ready frames",
      "Edited selects",
    ],
  },
  passport: {
    key: "passport",
    name: "Passport Photos",
    tagline: "Official photos, done right.",
    description:
      "A 15-minute session to get your official passport or visa photo — shot to meet official passport and visa requirements.",
    durationLabel: "15 min session",
    priceLabel: "Starting at $40",
    group: "photography",
    resource: "studio_photo",
    baseCents: 4000,
    baseMinutes: 15,
    additionalSlotCents: 0,
    allowsExtraTime: false,
    depositEligible: false,
    inclusions: [
      "15-minute session",
      "Passport and visa compliant crop",
      "Print-ready file",
      "On-the-spot retake if needed",
    ],
  },
  sports_media: {
    key: "sports_media",
    name: "Sports Media",
    tagline: "Athletes, in motion and in frame.",
    description:
      "A two-hour studio session for athletes and teams — portraits, media-day looks, and the stills that go out to coaches, scouts, and socials.",
    durationLabel: "2 hr session",
    priceLabel: "Starting at $175",
    group: "photography",
    resource: "studio_photo",
    baseCents: 17500,
    baseMinutes: 120,
    additionalSlotCents: 0,
    allowsExtraTime: true,
    depositEligible: false,
    inclusions: [
      "2-hour studio session",
      "Athlete and team portraits",
      "Media-day stills",
      "Edited gallery",
    ],
  },
  photo_studio: {
    key: "photo_studio",
    name: "Photo Studio Rental",
    tagline: "The photo studio, by the hour.",
    description:
      "Rent just the photo studio — lights, backdrops, and the room to make the work. Bring your own photographer, talent, and crew.",
    durationLabel: "Hourly",
    priceLabel: "$75 / hour",
    group: "rentals",
    resource: "studio_photo",
    baseCents: 7500,
    baseMinutes: 60,
    additionalSlotCents: 7500,
    extraStepMinutes: 60,
    maxExtraSlots: 8,
    allowsExtraTime: true,
    depositEligible: true,
    inclusions: [
      "Photo studio space",
      "Lighting and backdrops",
      "Billed by the hour",
      "You bring talent and crew",
    ],
  },
  full_studio: {
    key: "full_studio",
    name: "Full Studio Rental",
    tagline: "The whole Studio 7 floor.",
    description:
      "Rent the full studio by the hour — the photo studio plus the rest of the floor for production, rehearsals, and larger sets.",
    durationLabel: "Hourly",
    priceLabel: "$155 / hour",
    group: "rentals",
    resource: "studio_photo",
    baseCents: 15500,
    baseMinutes: 60,
    additionalSlotCents: 15500,
    extraStepMinutes: 60,
    maxExtraSlots: 8,
    allowsExtraTime: true,
    depositEligible: true,
    inclusions: [
      "Full studio floor",
      "Photo studio included",
      "Billed by the hour",
      "You bring talent and crew",
    ],
  },
  acting_cj: {
    key: "acting_cj",
    name: "Acting Class w/ CJ",
    tagline: "Where craft meets confidence.",
    description:
      "These sessions bring together technique, scene work, and real industry preparation — led by CJ, in a studio built for creatives. Show up ready to do the work.",
    durationLabel: "2 hr session",
    priceLabel: "$50 / class",
    group: "class",
    resource: "studio_acting",
    baseCents: 5000,
    baseMinutes: 120,
    additionalSlotCents: 0,
    allowsExtraTime: false,
    depositEligible: false,
    inclusions: [
      "2-hour group class",
      "Technique and scene work",
      "Industry preparation",
      "Led by CJ",
    ],
  },
};

export const STUDIO_OFFERING_LIST: StudioOffering[] = STUDIO_OFFERING_KEYS.map(
  (k) => STUDIO_OFFERINGS[k],
);

export const STUDIO_PHOTO_OFFERINGS = STUDIO_OFFERING_LIST.filter((o) => o.group === "photography");
export const STUDIO_RENTAL_OFFERINGS = STUDIO_OFFERING_LIST.filter((o) => o.group === "rentals");
export const STUDIO_CLASS_OFFERINGS = STUDIO_OFFERING_LIST.filter((o) => o.group === "class");

export const EXTRA_TIME_STEP_MINUTES = 30;
export const MAX_EXTRA_SLOTS = 4;
/** Deposit option only once the computed total reaches this (matches $225+ sessions). */
export const DEPOSIT_MIN_TOTAL_CENTS = 22500;

export function extraStepMinutes(offering: StudioOffering): number {
  return offering.extraStepMinutes ?? EXTRA_TIME_STEP_MINUTES;
}

export function maxExtraSlots(offering: StudioOffering): number {
  return offering.maxExtraSlots ?? MAX_EXTRA_SLOTS;
}

export const STUDIO_STRIPE_LOOKUP_KEY: Record<StudioOfferingKey, string> = {
  framehaus: "s7_framehaus",
  portraits: "s7_portraits",
  sports_media: "s7_sports_media",
  beauty: "s7_beauty",
  theatrical: "s7_theatrical",
  headshot: "s7_headshot",
  passport: "s7_passport",
  photo_studio: "s7_photo_studio",
  full_studio: "s7_full_studio",
  acting_cj: "s7_acting_cj",
};

export function isStudioOfferingKey(value: string | null | undefined): value is StudioOfferingKey {
  return Boolean(value && value in STUDIO_OFFERINGS);
}

export type StudioPriceInput = {
  offering: StudioOfferingKey;
  durationMinutes: number;
};

export type StudioPriceBreakdown = {
  offering: StudioOfferingKey;
  baseCents: number;
  baseMinutes: number;
  extraSlots: number;
  extraSlotMinutes: number;
  extraRateCents: number;
  extraCents: number;
  totalMinutes: number;
  totalCents: number;
  depositCents: number;
  balanceCents: number;
  depositEligible: boolean;
};

export function extraSlotsFromDuration(offering: StudioOffering, durationMinutes: number): number {
  if (!offering.allowsExtraTime || offering.additionalSlotCents <= 0) return 0;
  const step = extraStepMinutes(offering);
  const extraMinutes = Math.max(0, durationMinutes - offering.baseMinutes);
  return Math.min(maxExtraSlots(offering), Math.floor(extraMinutes / step));
}

export function calculateStudioPrice(input: StudioPriceInput): StudioPriceBreakdown {
  const offering = STUDIO_OFFERINGS[input.offering];
  const step = extraStepMinutes(offering);
  const extraSlots = extraSlotsFromDuration(offering, input.durationMinutes);
  const extraCents = extraSlots * offering.additionalSlotCents;
  const totalMinutes = offering.baseMinutes + extraSlots * step;
  const totalCents = offering.baseCents + extraCents;
  const depositOffered = offering.depositEligible && totalCents >= DEPOSIT_MIN_TOTAL_CENTS;
  const depositCents = depositOffered
    ? Math.round((totalCents * DEPOSIT_PERCENT) / 100)
    : totalCents;

  return {
    offering: offering.key,
    baseCents: offering.baseCents,
    baseMinutes: offering.baseMinutes,
    extraSlots,
    extraSlotMinutes: step,
    extraRateCents: offering.additionalSlotCents,
    extraCents,
    totalMinutes,
    totalCents,
    depositCents,
    balanceCents: totalCents - depositCents,
    depositEligible: depositOffered,
  };
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  const h = Math.floor(hours);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return `${h} hr ${m} min`;
}
