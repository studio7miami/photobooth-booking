import { Check } from "lucide-react";
import { EXPERIENCE_LIST, formatCents, type ExperienceKey } from "@/config/pricing";
import { cn } from "@/lib/utils";
import { IMAGES } from "@/assets/images";

export const EXPERIENCE_IMAGES: Record<ExperienceKey, { url: string; alt: string }> = {
  classic: {
    url: IMAGES.classic,
    alt: "Guest touching the screen of an illuminated ring-light photo booth",
  },
  social: {
    url: IMAGES.social,
    alt: "Studio 7 attendant beside a white ring-light photo booth at a Miami venue",
  },
  luxe: { url: IMAGES.luxe, alt: "Guests posing at a styled Studio 7 activation backdrop" },
};

/** Short slash-separated inclusion line — first four inclusions, condensed. */
function inclusionLine(items: string[]): string {
  return items
    .slice(0, 4)
    .map((i) => i.replace(/^\d+ hours of booth time$/i, "Booth time").replace(/ per station$/i, ""))
    .join(" / ");
}

export function StepExperience({
  value,
  onChange,
}: {
  value?: ExperienceKey;
  onChange: (key: ExperienceKey) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
      {EXPERIENCE_LIST.map((exp) => {
        const selected = value === exp.key;
        const image = EXPERIENCE_IMAGES[exp.key];
        const meta = `[${exp.guests.toUpperCase()}] · ${exp.baseHours} HOURS · +${formatCents(
          exp.additionalHourCents,
        )}/HR`;

        return (
          <button
            key={exp.key}
            type="button"
            onClick={() => onChange(exp.key)}
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
                  <h2 className="min-w-0 font-display text-base leading-tight text-pretty">
                    {exp.name}
                  </h2>
                  <span className="shrink-0 font-display text-sm tabular-nums">
                    {exp.custom ? "Custom" : formatCents(exp.baseCents)}
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
              {exp.description}
            </p>

            <p className="mt-3 flex-1 text-[11px] leading-relaxed text-muted-foreground/80">
              {inclusionLine(exp.inclusions)}
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
      })}
    </div>
  );
}
