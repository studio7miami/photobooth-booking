import { EXPERIENCES, formatCents, type PriceBreakdown } from "@/config/pricing";

export function PriceSummary({
  price,
  embedded = false,
}: {
  price: PriceBreakdown;
  embedded?: boolean;
}) {
  const tier = EXPERIENCES[price.experience];

  return (
    <div
      className={
        embedded ? "border-t border-border pt-4" : "rounded-[24px] border border-border soft-card p-6"
      }
    >
      <p className="label-caps text-[10px] text-muted-foreground">Your total</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">
        {formatCents(price.totalCents)}
      </p>

      <dl className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        <Row
          label={`${tier.name} · ${tier.baseHours} hrs`}
          value={formatCents(price.baseCents)}
        />
        {price.addlHours > 0 ? (
          <Row
            label={`${price.addlHours} additional ${price.addlHours === 1 ? "hour" : "hours"} × ${formatCents(price.addlRateCents)}`}
            value={formatCents(price.addlCents)}
          />
        ) : null}
        {price.perStation ? (
          <Row
            label={`${price.stationCount} ${price.stationCount === 1 ? "station" : "stations"} × ${formatCents(price.perStationCents)}`}
            value={formatCents(price.totalCents)}
          />
        ) : null}
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
