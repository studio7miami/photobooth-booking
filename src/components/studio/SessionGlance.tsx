import type { ReactNode } from "react";
import {
  formatCents,
  formatDurationMinutes,
  STUDIO_OFFERINGS,
  type StudioOfferingKey,
  type StudioPriceBreakdown,
} from "@/config/studio/offerings";
import { STUDIO_LOCATION } from "@/config/studio/booking-rules";
import { PillButton } from "@/components/booking/StepShell";

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
}) {
  const tier = offering ? STUDIO_OFFERINGS[offering] : null;
  const minutes = tier ? (durationMinutes ?? tier.baseMinutes) : null;
  const totalLabel = price
    ? formatCents(price.totalCents)
    : tier
      ? formatCents(tier.baseCents)
      : "—";

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <span className="label-caps text-[10px] text-muted-foreground">
            {tier ? tier.name : "No session selected"}
          </span>
          <span className="text-base font-semibold tabular-nums">{totalLabel}</span>
        </div>
        <PillButton onClick={onContinue} disabled={disabled}>
          {cta}
        </PillButton>
      </div>
    );
  }

  return (
    <div className="soft-card rounded-[24px] border border-border p-6">
      <p className="label-caps text-[10px] text-muted-foreground">Your session at a glance</p>

      <dl className="mt-5 space-y-3 text-sm">
        <Row label="Session" value={tier ? tier.name : "Not selected yet"} />
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
          <p className="mt-1 text-3xl font-semibold tabular-nums">{formatCents(price.totalCents)}</p>
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
                  {price.extraSlots} extra × {formatCents(price.extraRateCents)}
                </dt>
                <dd className="tabular-nums">{formatCents(price.extraCents)}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : (
        <dl className="mt-5 text-sm">
          <Row label="Starting price" value={tier ? formatCents(tier.baseCents) : "—"} strong />
        </dl>
      )}

      <div className="mt-6">
        <PillButton onClick={onContinue} disabled={disabled}>
          {cta}
        </PillButton>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <dt className="label-caps shrink-0 text-[10px] text-muted-foreground">{label}</dt>
      <dd className={strong ? "text-base font-semibold tabular-nums text-right" : "tabular-nums text-right"}>
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
