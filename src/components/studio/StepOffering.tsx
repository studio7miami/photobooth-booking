import { Check } from "lucide-react";
import { STUDIO_IMAGES } from "@/assets/images";
import {
  formatCents,
  STUDIO_CLASS_OFFERINGS,
  STUDIO_PHOTO_OFFERINGS,
  STUDIO_RENTAL_OFFERINGS,
  type StudioOffering,
  type StudioOfferingKey,
} from "@/config/studio/offerings";
import { cn } from "@/lib/utils";

export const STUDIO_OFFERING_IMAGES: Record<
  StudioOfferingKey,
  { url: string; alt: string; contain?: boolean; focus?: string }
> = {
  full_studio: {
    url: STUDIO_IMAGES.full_studio,
    alt: "Full studio rental at Studio 7 Miami",
    focus: "object-[55%_72%]",
  },
  photo_studio: {
    url: STUDIO_IMAGES.photo_studio,
    alt: "Photo studio rental at Studio 7 Miami",
    focus: "object-[78%_68%]",
  },
  framehaus: {
    url: STUDIO_IMAGES.framehaus,
    alt: "Digitals and comp cards with Framehaus Media",
    contain: true,
  },
  portraits: {
    url: STUDIO_IMAGES.portraits,
    alt: "Portrait session at Studio 7 Miami",
    focus: "object-[50%_18%]",
  },
  sports_media: {
    url: STUDIO_IMAGES.sports_media,
    alt: "Sports media session at Studio 7 Miami",
    focus: "object-[50%_14%]",
  },
  beauty: {
    url: STUDIO_IMAGES.beauty,
    alt: "Beauty headshot at Studio 7 Miami",
    focus: "object-[50%_68%]",
  },
  theatrical: {
    url: STUDIO_IMAGES.theatrical,
    alt: "Theatrical headshot at Studio 7 Miami",
    focus: "object-[50%_20%]",
  },
  headshot: {
    url: STUDIO_IMAGES.headshot,
    alt: "Standard headshot at Studio 7 Miami",
    focus: "object-[50%_22%]",
  },
  passport: {
    url: STUDIO_IMAGES.passport,
    alt: "Passport photo session at Studio 7 Miami",
    focus: "object-[50%_24%]",
  },
  acting_cj: {
    url: STUDIO_IMAGES.acting_cj,
    alt: "Acting class at Studio 7 Miami",
    focus: "object-[68%_42%]",
  },
};

export function offeringImageFocusClass(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return Object.values(STUDIO_OFFERING_IMAGES).find((image) => image.url === url)?.focus;
}

export function offeringThumbFitClass(image: { contain?: boolean; focus?: string }) {
  if (image.contain) return "bg-background object-contain p-1";
  return cn("object-cover", image.focus ?? "object-center");
}

function inclusionLine(items: string[]): string {
  return items.slice(0, 4).join(" / ");
}

function OfferingCard({
  offering,
  selected,
  onSelect,
}: {
  offering: StudioOffering;
  selected: boolean;
  onSelect: () => void;
}) {
  const image = STUDIO_OFFERING_IMAGES[offering.key];
  const meta = `${offering.durationLabel.toUpperCase()} · ${offering.priceLabel.toUpperCase()}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "ed-card flex h-full min-w-0 w-full flex-col p-4 text-left transition-colors sm:p-5",
        selected ? "border-foreground" : "hover:border-foreground/40",
      )}
    >
      <div className="flex min-h-[52px] items-start gap-3">
        <img
          src={image.url}
          alt={image.alt}
          width={64}
          height={64}
          loading="lazy"
          className={cn("size-16 shrink-0 rounded-[12px]", offeringThumbFitClass(image))}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="min-w-0 font-display text-base leading-tight text-pretty">
              {offering.name}
            </h2>
            <span className="shrink-0 font-display text-sm tabular-nums">
              {formatCents(offering.baseCents)}
              {offering.group === "rentals" ? (
                <span className="text-xs font-normal">/hr</span>
              ) : null}
            </span>
          </div>
          <p className="label-caps mt-1.5 min-h-[2.25em] text-[9.5px] leading-snug text-muted-foreground">
            {meta}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background",
            selected ? "visible" : "invisible",
          )}
          aria-hidden="true"
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
      </div>

      <div className="ed-hairline mt-4" />

      <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
        {offering.description}
      </p>
      <p className="mt-3 flex-1 text-[11px] leading-relaxed text-muted-foreground/80">
        {inclusionLine(offering.inclusions)}
      </p>
      <span
        className={cn(
          "label-caps mt-5 text-[10px]",
          selected ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {selected ? "[ Selected ]" : "[ Select ]"}
      </span>
    </button>
  );
}

export function StepOffering({
  value,
  onChange,
}: {
  value?: StudioOfferingKey;
  onChange: (key: StudioOfferingKey) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps text-[10px] text-muted-foreground">Studio rentals</p>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          {STUDIO_RENTAL_OFFERINGS.map((offering) => (
            <OfferingCard
              key={offering.key}
              offering={offering}
              selected={value === offering.key}
              onSelect={() => onChange(offering.key)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="label-caps text-[10px] text-muted-foreground">Photography</p>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          {STUDIO_PHOTO_OFFERINGS.map((offering) => (
            <OfferingCard
              key={offering.key}
              offering={offering}
              selected={value === offering.key}
              onSelect={() => onChange(offering.key)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="label-caps text-[10px] text-muted-foreground">Class</p>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          {STUDIO_CLASS_OFFERINGS.map((offering) => (
            <OfferingCard
              key={offering.key}
              offering={offering}
              selected={value === offering.key}
              onSelect={() => onChange(offering.key)}
            />
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Looking for a photobooth rental?{" "}
        <a href="/photobooth" className="underline underline-offset-4 hover:text-foreground">
          Book the booth
        </a>
        .
      </p>
    </div>
  );
}
