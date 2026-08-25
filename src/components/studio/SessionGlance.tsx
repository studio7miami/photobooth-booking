import type { ReactNode } from "react";
import {
  formatCents,
  formatDurationMinutes,
  STUDIO_OFFERINGS,
  type StudioOfferingKey,
  type StudioPriceBreakdown,
} from "@/config/studio/offerings";
import { STUDIO_LOCATION } from "@/config/studio/booking-rules";
import { offeringThumbFitClass, STUDIO_OFFERING_IMAGES } from "@/components/studio/StepOffering";
import { PillButton } from "@/components/booking/StepShell";
import { cn } from "@/lib/utils";

export function SessionGlance({
  offering,
  eventDate,
  eventStartTime,
  durationMinutes,
  price,
  onContinue,
  disabled,
  cta = "Continue",
  compact = false,
  variant = "card",
  hidePhoto = false,
  shooterName,
}: {
  offering?: StudioOfferingKey | undefined;
  eventDate?: string | undefined;
  eventStartTime?: string | undefined;
  durationMinutes?: number | undefined;
  price?: StudioPriceBreakdown | null | undefined;
  onContinue: () => void;
  disabled?: boolean;
  cta?: string;
  compact?: boolean;
  variant?: "card" | "slim";
  hidePhoto?: boolean;
  shooterName?: string | undefined;
}) {
  const tier = offering ? STUDIO_OFFERINGS[offering] : null;
  const image = offering ? STUDIO_OFFERING_IMAGES[offering] : null;
  const isRental = tier?.group === "rentals";
  const minutes = tier ? (durationMinutes ?? tier.baseMinutes) : null;
  const totalLabel = price
    ? formatCents(price.totalCents)
    : tier
      ? `${formatCents(tier.baseCents)}${isRental ? "/hr" : ""}`
      : "—";
  const recapLine = [
    minutes ? formatDurationMinutes(minutes) : null,
    shooterName ?? null,
    eventDate ? formatDate(eventDate) : null,
    eventStartTime ? formatTime(eventStartTime) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <span className="flex min-w-0 items-center gap-3">
            {image ? (
              <img
                src={image.url}
                alt=""
                width={40}
                height={40}
                className={cn("size-10 shrink-0 rounded-[10px]", offeringThumbFitClass(image))}
              />
            ) : null}
            <span className="label-caps min-w-0 truncate text-[10px] text-muted-foreground">
              {tier ? tier.name : "Nothing selected"}
            </span>
          </span>
          <span className="shrink-0 text-base font-semibold tabular-nums">{totalLabel}</span>
        </div>
        <PillButton onClick={onContinue} disabled={disabled}>
          {cta}
        </PillButton>
      </div>
    );
  }

  if (variant === "slim") {
    return (
      <div>
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="label-caps text-[10px] text-muted-foreground">
              {tier ? tier.name : "Nothing selected"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{recapLine || "Studio 7 Miami"}</p>
          </div>
          <p className="shrink-0 font-display text-2xl tabular-nums">{totalLabel}</p>
        </div>
        <div className="mt-5">
          <PillButton onClick={onContinue} disabled={disabled}>
            {cta}
          </PillButton>
        </div>
      </div>
    );
  }

  return (
    <div className="soft-card overflow-hidden rounded-[24px] border border-border">
      {image && !hidePhoto ? (
        <img
          src={image.url}
          alt={image.alt}
          className={cn(
            "block w-full",
            image.contain ? "aspect-square bg-background object-contain p-8" : "h-auto",
          )}
        />
      ) : null}

      <div className="p-6">
        <p className="label-caps text-[10px] text-muted-foreground">
          {isRental ? "Your rental at a glance" : "Your session at a glance"}
        </p>

        <dl className="mt-5 space-y-3 text-sm">
          <Row
            label={isRental ? "Rental" : "Session"}
            value={tier ? tier.name : "Not selected yet"}
          />
          {eventDate ? <Row label="Date" value={formatDate(eventDate)} /> : null}
          {eventStartTime ? <Row label="Start" value={formatTime(eventStartTime)} /> : null}
          <Row label="Duration" value={minutes ? formatDurationMinutes(minutes) : "—"} />
          <Row
            label="Location"
            value={
              <span className="block">
                {STUDIO_LOCATION.split(" — ").map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            }
          />
        </dl>

        {price ? (
          <div className="mt-5 border-t border-border pt-4">
            <p className="label-caps text-[10px] text-muted-foreground">Your total</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {formatCents(price.totalCents)}
            </p>
            <dl className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-baseline justify-between gap-4">
                <dt>
                  {tier?.name} · {formatDurationMinutes(price.baseMinutes)}
                </dt>
                <dd className="tabular-nums">{formatCents(price.baseCents)}</dd>
              </div>
              {price.extraSlots > 0 ? (
                <div className="flex items-baseline justify-between gap-4">
                  <dt>
                    {isRental
                      ? `${price.extraSlots} extra hour${price.extraSlots === 1 ? "" : "s"}`
                      : `${price.extraSlots} extra × ${formatCents(price.extraRateCents)}`}
                  </dt>
                  <dd className="tabular-nums">{formatCents(price.extraCents)}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : (
          <dl className="mt-5 text-sm">
            <Row
              label={isRental ? "Hourly rate" : "Starting price"}
              value={tier ? `${formatCents(tier.baseCents)}${isRental ? "/hr" : ""}` : "—"}
              strong
            />
          </dl>
        )}

        <div className="mt-6">
          <PillButton onClick={onContinue} disabled={disabled}>
            {cta}
          </PillButton>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <dt className="label-caps shrink-0 text-[10px] text-muted-foreground">{label}</dt>
      <dd
        className={
          strong ? "text-base font-semibold tabular-nums text-right" : "tabular-nums text-right"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function formatDate(v: string) {
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(v: string) {
  const [h, m] = v.split(":").map(Number);
  const hour = h ?? 0;
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${`${m ?? 0}`.padStart(2, "0")} ${suffix}`;
}
