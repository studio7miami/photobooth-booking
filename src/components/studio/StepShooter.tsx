import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Shuffle } from "lucide-react";
import { FieldError } from "@/components/booking/StepShell";
import { listBookableShooters } from "@/lib/studio/shooters.functions";
import { isSurpriseShooter, SURPRISE_SHOOTER, type BookableShooter } from "@/lib/studio/shooters";
import { cn } from "@/lib/utils";

export function StepShooter({
  shooterId,
  eventDate,
  eventStartTime,
  durationMinutes,
  excludeBookingId,
  error,
  onChange,
}: {
  shooterId?: string | undefined;
  eventDate?: string | undefined;
  eventStartTime?: string | undefined;
  durationMinutes: number;
  excludeBookingId?: string | undefined;
  error?: string | undefined;
  onChange: (patch: { shooterId?: string; shooterName?: string }) => void;
}) {
  const ready = Boolean(eventDate && eventStartTime);
  const [shooters, setShooters] = React.useState<BookableShooter[]>([]);
  const [directoryCount, setDirectoryCount] = React.useState(0);
  const [loading, setLoading] = React.useState(ready);
  const load = useServerFn(listBookableShooters);
  const anyone = isSurpriseShooter(shooterId);

  React.useEffect(() => {
    if (!ready || !eventDate || !eventStartTime) {
      setShooters([]);
      setDirectoryCount(0);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    const fetchList = (showLoading: boolean) => {
      if (showLoading) setLoading(true);
      void load({
        data: {
          eventDate,
          eventStartTime,
          durationMinutes,
          ...(excludeBookingId ? { excludeBookingId } : {}),
        },
      })
        .then((result) => {
          if (!active) return;
          setShooters(result.shooters);
          setDirectoryCount(result.directoryCount);
        })
        .catch(() => {
          if (!active) return;
          setShooters([]);
          setDirectoryCount(0);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    fetchList(true);
    const id = window.setInterval(() => fetchList(false), 20_000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [load, ready, eventDate, eventStartTime, durationMinutes, excludeBookingId]);

  React.useEffect(() => {
    if (!ready || loading || !shooterId || isSurpriseShooter(shooterId)) return;
    if (!shooters.some((shooter) => shooter.id === shooterId)) {
      onChange({ shooterId: undefined, shooterName: undefined });
    }
    // Parent onChange isn't stable; only re-check when the list or selection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, loading, shooterId, shooters]);

  const allBusy = ready && !loading && directoryCount > 0 && shooters.length === 0;

  return (
    <div className="rounded-[24px] border border-border soft-card p-5 sm:p-6">
      <p className="label-caps text-[10px] text-muted-foreground">Select your shooter</p>

      {!ready ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Choose a date and time to see who's free.
        </p>
      ) : loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading photographers…</p>
      ) : (
        <>
          {shooters.length > 0 ? (
            <div className="mt-4 space-y-2">
              {shooters.map((shooter) => (
                <NameRow
                  key={shooter.id}
                  shooter={shooter}
                  selected={shooterId === shooter.id}
                  onSelect={() => onChange({ shooterId: shooter.id, shooterName: shooter.name })}
                />
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() =>
              onChange({ shooterId: SURPRISE_SHOOTER.id, shooterName: SURPRISE_SHOOTER.name })
            }
            aria-pressed={anyone}
            className={cn(
              "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-colors",
              anyone
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}
          >
            <Shuffle className="size-3.5 shrink-0" />
            <span>No preference — whoever's available</span>
          </button>
        </>
      )}

      {ready && !loading && directoryCount === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Photographers appear here from the team directory when they are marked bookable.
        </p>
      ) : null}

      {allBusy ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No one from the team is free at this time. Pick another slot, or choose no preference.
        </p>
      ) : null}

      <FieldError message={error} />
    </div>
  );
}

function NameRow({
  shooter,
  selected,
  onSelect,
}: {
  shooter: BookableShooter;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-[16px] border px-4 py-3.5 text-left transition-colors",
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-border hover:border-foreground/40",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm leading-tight">{shooter.name}</span>
        {shooter.portfolioUrl ? (
          <a
            href={shooter.portfolioUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "mt-1 inline-block text-[11px] underline underline-offset-4",
              selected ? "text-background/80" : "text-muted-foreground",
            )}
          >
            View work
          </a>
        ) : null}
      </span>
      <span
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-background text-foreground",
          selected ? "visible" : "invisible",
        )}
        aria-hidden="true"
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
    </button>
  );
}
