import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { Calendar as CalendarIcon, Clock as ClockIcon, Minus, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { PHOTO_TIME_SLOTS } from "@/config/studio/booking-rules";
import {
  EXTRA_TIME_STEP_MINUTES,
  formatCents,
  formatDurationMinutes,
  MAX_EXTRA_SLOTS,
  STUDIO_OFFERINGS,
  type StudioOfferingKey,
} from "@/config/studio/offerings";
import { isPhotoDateClosed, isPhotoSlotOpen, type Occupancy } from "@/lib/studio/availability";
import { listActingSessions, listStudioPhotoOccupancy } from "@/lib/studio/availability.functions";
import type { ActingSession } from "@/lib/studio/availability";
import { FieldError } from "@/components/booking/StepShell";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatTime } from "@/components/booking/StepTime";
import { cn } from "@/lib/utils";

export type StudioTimeValues = {
  eventDate?: string | undefined;
  eventStartTime?: string | undefined;
  durationMinutes?: number | undefined;
  classSessionId?: string | undefined;
};

export function StepStudioTime({
  offering,
  values,
  errors,
  onChange,
  excludeBookingId,
}: {
  offering: StudioOfferingKey;
  values: StudioTimeValues;
  errors: Record<string, string | undefined>;
  onChange: (patch: StudioTimeValues) => void;
  excludeBookingId?: string | undefined;
}) {
  const tier = STUDIO_OFFERINGS[offering];
  if (tier.resource === "studio_acting") {
    return (
      <ActingSessionPicker
        values={values}
        errors={errors}
        onChange={onChange}
        excludeBookingId={excludeBookingId}
      />
    );
  }
  return (
    <PhotoTimePicker
      offering={offering}
      values={values}
      errors={errors}
      onChange={onChange}
      excludeBookingId={excludeBookingId}
    />
  );
}

function PhotoTimePicker({
  offering,
  values,
  errors,
  onChange,
  excludeBookingId,
}: {
  offering: StudioOfferingKey;
  values: StudioTimeValues;
  errors: Record<string, string | undefined>;
  onChange: (patch: StudioTimeValues) => void;
  excludeBookingId?: string | undefined;
}) {
  const [dateOpen, setDateOpen] = React.useState(false);
  const [timeOpen, setTimeOpen] = React.useState(false);
  const [occupancy, setOccupancy] = React.useState<Occupancy[]>([]);
  const loadOccupancy = useServerFn(listStudioPhotoOccupancy);
  const tier = STUDIO_OFFERINGS[offering];
  const duration = values.durationMinutes ?? tier.baseMinutes;
  const extraSlots = Math.max(0, Math.round((duration - tier.baseMinutes) / EXTRA_TIME_STEP_MINUTES));
  const showExtra = tier.allowsExtraTime && tier.additionalSlotCents > 0;
  const minDate = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return d;
  }, []);
  const selectedDate = values.eventDate ? parseISODate(values.eventDate) : undefined;

  React.useEffect(() => {
    let active = true;
    const load = () => {
      void loadOccupancy({
        data: excludeBookingId ? { excludeBookingId } : {},
      })
        .then((rows) => {
          if (active) setOccupancy(rows);
        })
        .catch(() => {
          if (active) setOccupancy([]);
        });
    };
    load();
    const id = window.setInterval(load, 20_000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [loadOccupancy, excludeBookingId]);

  React.useEffect(() => {
    if (!values.eventDate) return;
    if (isPhotoDateClosed(occupancy, values.eventDate, duration)) {
      onChange({ eventDate: undefined, eventStartTime: undefined });
      return;
    }
    if (
      values.eventStartTime &&
      !isPhotoSlotOpen(occupancy, values.eventDate, values.eventStartTime, duration)
    ) {
      onChange({ eventStartTime: undefined });
    }
  }, [occupancy, duration, values.eventDate, values.eventStartTime]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[24px] border border-border soft-card p-4 sm:p-6">
        <Label className="label-caps text-[10px] text-muted-foreground">Session date</Label>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="soft-inset mt-2 flex h-14 w-full items-center justify-between gap-3 rounded-[16px] border border-border bg-background px-4 text-left text-base transition-colors hover:border-foreground/30"
            >
              <span className={values.eventDate ? "text-foreground" : "text-muted-foreground"}>
                {values.eventDate ? formatLong(values.eventDate) : "Select your date"}
              </span>
              <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="bottom"
            sideOffset={8}
            avoidCollisions={false}
            className="max-h-[var(--radix-popover-content-available-height)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-[18px] p-0"
          >
            <Calendar
              mode="single"
              weekStartsOn={1}
              {...(selectedDate ? { selected: selectedDate } : {})}
              {...(selectedDate ? { defaultMonth: selectedDate } : {})}
              disabled={[
                { before: minDate },
                (day) => isPhotoDateClosed(occupancy, toISODate(day), duration),
              ]}
              onSelect={(d) => {
                const next = d ? toISODate(d) : undefined;
                if (next && isPhotoDateClosed(occupancy, next, duration)) return;
                onChange({ eventDate: next, eventStartTime: undefined, classSessionId: undefined });
                if (d) setDateOpen(false);
              }}
              className="pointer-events-auto w-full rounded-[18px] bg-background p-3 [--cell-size:2.5rem]"
              classNames={{
                caption_label: "text-sm font-medium tracking-tight",
                weekday:
                  "flex-1 select-none text-[10px] font-normal uppercase tracking-[0.14em] text-muted-foreground",
                day: "group/day relative aspect-square h-full w-full select-none p-0 text-center",
              }}
            />
          </PopoverContent>
        </Popover>
        <FieldError message={errors["eventDate"]} />
      </div>

      <div className="rounded-[24px] border border-border soft-card p-5 sm:p-6">
        <Label className="label-caps text-[10px] text-muted-foreground">Start time</Label>
        <Popover open={timeOpen} onOpenChange={setTimeOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="soft-inset mt-2 flex h-14 w-full items-center justify-between gap-3 rounded-[16px] border border-border bg-background px-4 text-left text-base transition-colors hover:border-foreground/30"
            >
              <span className={values.eventStartTime ? "text-foreground" : "text-muted-foreground"}>
                {values.eventStartTime ? formatTime(values.eventStartTime) : "Select a start time"}
              </span>
              <ClockIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="bottom"
            sideOffset={8}
            avoidCollisions={false}
            className="max-h-[var(--radix-popover-content-available-height)] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[18px] p-3"
          >
            <div className="grid max-h-[min(18rem,calc(var(--radix-popover-content-available-height)-2rem))] grid-cols-3 gap-1.5 overflow-y-auto pr-1">
              {PHOTO_TIME_SLOTS.map((slot) => {
                const active = values.eventStartTime === slot;
                const open =
                  Boolean(values.eventDate) &&
                  isPhotoSlotOpen(occupancy, values.eventDate as string, slot, duration);
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={!open}
                    onClick={() => {
                      if (!open) return;
                      onChange({ eventStartTime: slot, classSessionId: undefined });
                      setTimeOpen(false);
                    }}
                    className={
                      active
                        ? "rounded-full bg-foreground px-2 py-2 text-xs tabular-nums text-background"
                        : open
                          ? "rounded-full px-2 py-2 text-xs tabular-nums transition-colors hover:bg-muted"
                          : "rounded-full px-2 py-2 text-xs tabular-nums text-muted-foreground/40"
                    }
                  >
                    {formatTime(slot)}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
        <p className="mt-2 text-xs text-muted-foreground">Times are Eastern (Miami). Studio hours 10:00 AM – 7:00 PM.</p>
        <FieldError message={errors["eventStartTime"]} />
      </div>

      {showExtra ? (
        <div className="rounded-[24px] border border-border soft-card p-5 sm:p-6">
          <p className="label-caps text-[10px] text-muted-foreground">Duration</p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-4xl font-semibold leading-none tracking-tight tabular-nums">
                {formatDurationMinutes(duration)}
              </p>
              <p className="mt-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {extraSlots > 0
                  ? `+${extraSlots * EXTRA_TIME_STEP_MINUTES} min · ${formatCents(extraSlots * tier.additionalSlotCents)}`
                  : `${formatDurationMinutes(tier.baseMinutes)} included · extra ${formatCents(tier.additionalSlotCents)} / ${EXTRA_TIME_STEP_MINUTES} min`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RoundButton
                aria-label="Decrease duration"
                disabled={duration <= tier.baseMinutes}
                onClick={() =>
                  onChange({
                    durationMinutes: Math.max(tier.baseMinutes, duration - EXTRA_TIME_STEP_MINUTES),
                    eventStartTime: undefined,
                  })
                }
              >
                <Minus className="size-4" aria-hidden="true" />
              </RoundButton>
              <RoundButton
                aria-label="Increase duration"
                disabled={extraSlots >= MAX_EXTRA_SLOTS}
                onClick={() =>
                  onChange({
                    durationMinutes: duration + EXTRA_TIME_STEP_MINUTES,
                    eventStartTime: undefined,
                  })
                }
              >
                <Plus className="size-4" aria-hidden="true" />
              </RoundButton>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {formatDurationMinutes(tier.baseMinutes)} included. Add extra time in {EXTRA_TIME_STEP_MINUTES}-minute steps.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ActingSessionPicker({
  values,
  errors,
  onChange,
  excludeBookingId,
}: {
  values: StudioTimeValues;
  errors: Record<string, string | undefined>;
  onChange: (patch: StudioTimeValues) => void;
  excludeBookingId?: string | undefined;
}) {
  const [sessions, setSessions] = React.useState<ActingSession[]>([]);
  const [loading, setLoading] = React.useState(true);
  const loadSessions = useServerFn(listActingSessions);

  React.useEffect(() => {
    let active = true;
    const load = () => {
      void loadSessions({
        data: excludeBookingId ? { excludeBookingId } : {},
      })
        .then((rows) => {
          if (!active) return;
          setSessions(rows);
          setLoading(false);
        })
        .catch(() => {
          if (!active) return;
          setSessions([]);
          setLoading(false);
        });
    };
    load();
    const id = window.setInterval(load, 20_000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [loadSessions, excludeBookingId]);

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-border soft-card p-5 sm:p-6">
        <p className="label-caps text-[10px] text-muted-foreground">Upcoming classes</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a published session with CJ. Seats are limited.
        </p>
        <div className="mt-4 space-y-2">
          {loading && sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading class times…</p>
          ) : null}
          {!loading && sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No open classes in the next few weeks. Check back soon, or message the studio.
            </p>
          ) : null}
          {sessions.map((session) => {
            const selected = values.classSessionId === session.id;
            return (
              <button
                key={session.id}
                type="button"
                onClick={() =>
                  onChange({
                    classSessionId: session.id,
                    eventDate: session.date,
                    eventStartTime: session.startTime,
                    durationMinutes: session.durationMinutes,
                  })
                }
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-[16px] border px-4 py-4 text-left transition-colors",
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground/40",
                )}
              >
                <span>
                  <span className="block font-display text-sm">{formatLong(session.date)}</span>
                  <span className={cn("mt-1 block text-xs", selected ? "text-background/80" : "text-muted-foreground")}>
                    {formatTime(session.startTime)} · 2 hours
                  </span>
                </span>
                <span className="label-caps shrink-0 text-[10px]">
                  {session.remaining} of {session.capacity} left
                </span>
              </button>
            );
          })}
        </div>
        <FieldError message={errors["classSessionId"] ?? errors["eventDate"] ?? errors["eventStartTime"]} />
      </div>
    </div>
  );
}

function RoundButton({
  children,
  disabled,
  onClick,
  ...rest
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="soft-card inline-flex size-12 items-center justify-center rounded-full border border-border transition-all hover:border-foreground/40 active:translate-y-[1px] disabled:opacity-30 disabled:shadow-none"
      {...rest}
    >
      {children}
    </button>
  );
}

function toISODate(d: Date) {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function parseISODate(v: string) {
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function formatLong(v: string) {
  return parseISODate(v).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
