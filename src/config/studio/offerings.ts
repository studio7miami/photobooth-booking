/**
 * Studio 7 Miami — in-studio session catalog.
 *
 * Separate from photobooth rental pricing. Amounts are integer cents, USD.
 * Extra time is billed in 30-minute steps when `additionalSlotCents` is set.
 */

import { DEPOSIT_PERCENT, formatCents } from "@/config/pricing";

export { formatCents };

export const STUDIO_OFFERING_KEYS = [
  "framehaus",
  "portraits",
  "beauty",
  "theatrical",
  "headshot",
  "passport",
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
  group: "photography" | "class";
  resource: StudioResource;
  baseCents: number;
  baseMinutes: number;
  /**
   * Extra 30-minute step price. `0` hides the extra-time stepper until
   * Studio 7 sets a rate.
   */
  additionalSlotCents: number;
  allowsExtraTime: boolean;
  depositEligible: boolean;
  inclusions: string[];
};

export const STUDIO_OFFERINGS: Record<StudioOfferingKey, StudioOffering> = {
  framehaus: {
    key: "framehaus",
    name: "Framehaus Media",
    tagline: "Digitals & comp cards, shot as you are.",
    description:
      "For models targeting agencies and casting calls that want to see you as you are. Shot in a studio, this session delivers the industry-standard photos and walk footage that agencies, show curators, and casting directors need — clean, unfiltered, and ready to submit.",
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
    priceLabel: "Starting at $350",
    group: "photography",
    resource: "studio_photo",
    baseCents: 35000,
    baseMinutes: 90,
    additionalSlotCents: 0,
    allowsExtraTime: true,
    depositEligible: true,
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
    priceLabel: "Starting at $300",
    group: "photography",
    resource: "studio_photo",
    baseCents: 30000,
    baseMinutes: 90,
    additionalSlotCents: 0,
    allowsExtraTime: true,
    depositEligible: true,
    inclusions: [
      "90-minute session",
      "Two polished looks",
      "Beauty lighting",
      "Edited gallery",
    ],
  },
  theatrical: {
    key: "theatrical",
    name: "Theatrical Headshots",
    tagline: "Built for the performer.",
    description:
      "Two styled looks crafted for casting calls and creative submissions that need to show your range. A 90-minute session to capture every side of your story.",
    durationLabel: "90 min session",
    priceLabel: "Starting at $300",
    group: "photography",
    resource: "studio_photo",
    baseCents: 30000,
    baseMinutes: 90,
    additionalSlotCents: 0,
    allowsExtraTime: true,
    depositEligible: true,
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
    priceLabel: "Starting at $225",
    group: "photography",
    resource: "studio_photo",
    baseCents: 22500,
    baseMinutes: 30,
    additionalSlotCents: 0,
    allowsExtraTime: true,
    depositEligible: true,
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
    priceLabel: "Starting at $50",
    group: "photography",
    resource: "studio_photo",
    baseCents: 5000,
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
  acting_cj: {
    key: "acting_cj",
    name: "Acting Class w/ CJ",
    tagline: "Where craft meets confidence.",
    description:
      "These sessions bring together technique, scene work, and real industry preparation — led by CJ, in a studio built for creatives. Show up ready to do the work.",
    durationLabel: "2 hr session",
    priceLabel: "Starting at $50",
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
export const STUDIO_CLASS_OFFERINGS = STUDIO_OFFERING_LIST.filter((o) => o.group === "class");

export const EXTRA_TIME_STEP_MINUTES = 30;
export const MAX_EXTRA_SLOTS = 4;

export const STUDIO_STRIPE_LOOKUP_KEY: Record<StudioOfferingKey, string> = {
  framehaus: "s7_framehaus",
  portraits: "s7_portraits",
  beauty: "s7_beauty",
  theatrical: "s7_theatrical",
  headshot: "s7_headshot",
  passport: "s7_passport",
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
  const extraMinutes = Math.max(0, durationMinutes - offering.baseMinutes);
  return Math.min(
    MAX_EXTRA_SLOTS,
    Math.floor(extraMinutes / EXTRA_TIME_STEP_MINUTES),
  );
}

export function calculateStudioPrice(input: StudioPriceInput): StudioPriceBreakdown {
  const offering = STUDIO_OFFERINGS[input.offering];
  const extraSlots = extraSlotsFromDuration(offering, input.durationMinutes);
  const extraCents = extraSlots * offering.additionalSlotCents;
  const totalMinutes = offering.baseMinutes + extraSlots * EXTRA_TIME_STEP_MINUTES;
  const totalCents = offering.baseCents + extraCents;
  const depositCents = offering.depositEligible
    ? Math.round((totalCents * DEPOSIT_PERCENT) / 100)
    : totalCents;

  return {
    offering: offering.key,
    baseCents: offering.baseCents,
    baseMinutes: offering.baseMinutes,
    extraSlots,
    extraSlotMinutes: EXTRA_TIME_STEP_MINUTES,
    extraRateCents: offering.additionalSlotCents,
    extraCents,
    totalMinutes,
    totalCents,
    depositCents,
    balanceCents: totalCents - depositCents,
    depositEligible: offering.depositEligible,
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
