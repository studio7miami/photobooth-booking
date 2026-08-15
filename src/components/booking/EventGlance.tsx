import type { ReactNode } from "react";
import {
  EXPERIENCES,
  formatCents,
  type ExperienceKey,
  type PriceBreakdown,
} from "@/config/pricing";
import { formatAddressLines } from "@/lib/format-display";
import { HoldTimer } from "./HoldTimer";
import { PriceSummary } from "./PriceSummary";
import { PillButton } from "./StepShell";

export function EventGlance({
  experience,
  eventDate,
  eventStartTime,
  eventLocation,
  durationHours,
  stationCount,
  price,
  onContinue,
  disabled,
  cta = "Continue",
  compact = false,
  holdSignedAt,
  onHoldExpired,
}: {
  experience?: ExperienceKey | undefined;
  eventDate?: string | undefined;
  eventStartTime?: string | undefined;
  eventLocation?: string | undefined;
  durationHours?: number | undefined;
  stationCount?: number | null | undefined;
  price?: PriceBreakdown | null | undefined;

  onContinue: () => void;
  disabled?: boolean;
  cta?: string;
  compact?: boolean;
  holdSignedAt?: string | undefined;
  onHoldExpired?: (() => void) | undefined;
}) {
  const tier = experience ? EXPERIENCES[experience] : null;
  const hours = tier ? (durationHours ?? tier.baseHours) : null;
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
            {tier ? tier.name : "No experience selected"}
          </span>
          <span className="text-base font-semibold tabular-nums">
            {tier?.custom ? "Custom quote" : totalLabel}
          </span>
        </div>
        <PillButton onClick={onContinue} disabled={disabled}>
          {cta}
        </PillButton>
        {holdSignedAt ? (
          <HoldTimer signedAt={holdSignedAt} {...(onHoldExpired ? { onExpired: onHoldExpired } : {})} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="soft-card rounded-[24px] border border-border p-6">
      <p className="label-caps text-[10px] text-muted-foreground">Your event at a glance</p>

      <dl className="mt-5 space-y-3 text-sm">
        <Row label="Package" value={tier ? tier.name : "Not selected yet"} />
        {eventDate ? <Row label="Date" value={formatDate(eventDate)} /> : null}
        {eventStartTime ? <Row label="Start" value={formatTime(eventStartTime)} /> : null}
        <Row
          label="Duration"
          value={
            tier
              ? tier.custom
                ? "Custom duration"
                : `${hours} ${hours === 1 ? "hour" : "hours"}${tier.perStation ? " per station" : ""}`
              : "—"
          }
        />
        {tier?.perStation && stationCount ? (
          <Row label="Stations" value={String(stationCount)} />
        ) : null}
        {eventLocation ? (
          <Row
            label="Location"
            value={
              <span className="block">
                {formatAddressLines(eventLocation).map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            }
          />
        ) : null}
      </dl>

      {price && !tier?.custom ? (
        <div className="mt-5">
          <PriceSummary price={price} embedded />
        </div>
      ) : (
        <dl className="mt-5 text-sm">
          <Row
            label="Starting price"
            value={tier?.custom ? "Custom quote" : tier ? formatCents(tier.baseCents) : "—"}
            strong
          />
        </dl>
      )}

      <div className="mt-6">
        <PillButton onClick={onContinue} disabled={disabled}>
          {cta}
        </PillButton>
      </div>
      {holdSignedAt ? (
        <div className="mt-3">
          <HoldTimer signedAt={holdSignedAt} {...(onHoldExpired ? { onExpired: onHoldExpired } : {})} />
        </div>
      ) : null}
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
