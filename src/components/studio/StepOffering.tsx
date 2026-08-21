import { Check } from "lucide-react";
import { IMAGES } from "@/assets/images";
import {
  formatCents,
  STUDIO_CLASS_OFFERINGS,
  STUDIO_PHOTO_OFFERINGS,
  type StudioOffering,
  type StudioOfferingKey,
} from "@/config/studio/offerings";
import { cn } from "@/lib/utils";

export const STUDIO_OFFERING_IMAGES: Record<StudioOfferingKey, { url: string; alt: string }> = {
  framehaus: { url: IMAGES.social, alt: "Studio digitals and walk footage session" },
  portraits: { url: IMAGES.luxe, alt: "Portrait session at Studio 7 Miami" },
  beauty: { url: IMAGES.classic, alt: "Beauty headshot lighting" },
  theatrical: { url: IMAGES.luxe, alt: "Theatrical headshot looks" },
  headshot: { url: IMAGES.classic, alt: "Standard white-backdrop headshot" },
  passport: { url: IMAGES.palm, alt: "Passport photo session" },
  acting_cj: { url: IMAGES.social, alt: "Acting class in the studio" },
};

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
          width={96}
          height={96}
          loading="lazy"
          className="size-10 shrink-0 rounded-[10px] object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="min-w-0 font-display text-base leading-tight text-pretty">{offering.name}</h2>
            <span className="shrink-0 font-display text-sm tabular-nums">
              {formatCents(offering.baseCents)}
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

      <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">{offering.description}</p>
      <p className="mt-3 flex-1 text-[11px] leading-relaxed text-muted-foreground/80">
        {inclusionLine(offering.inclusions)}
      </p>
      <span className={cn("label-caps mt-5 text-[10px]", selected ? "text-foreground" : "text-muted-foreground")}>
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
