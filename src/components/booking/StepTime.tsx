import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { Calendar as CalendarIcon, Clock as ClockIcon, Minus, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { TIME_SLOTS } from "@/config/booking-rules";
import { EXPERIENCES, type ExperienceKey } from "@/config/pricing";
import { isDateClosed, isSlotOpen, type Occupancy } from "@/lib/availability";
import { listOccupancy } from "@/lib/availability.functions";
import { FieldError } from "./StepShell";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type TimeValues = {
  eventDate?: string | undefined;
  eventStartTime?: string | undefined;
  durationHours?: number | undefined;
  stationCount?: number | null | undefined;
};

export function StepTime({
  experience,
  values,
  errors,
  onChange,
  excludeBookingId,
}: {
  experience: ExperienceKey;
  values: TimeValues;
  errors: Record<string, string | undefined>;
  onChange: (patch: TimeValues) => void;
  excludeBookingId?: string | undefined;
}) {
  const [dateOpen, setDateOpen] = React.useState(false);
  const [timeOpen, setTimeOpen] = React.useState(false);
  const [occupancy, setOccupancy] = React.useState<Occupancy[]>([]);
  const loadOccupancy = useServerFn(listOccupancy);
  const tier = EXPERIENCES[experience];
  const duration = values.durationHours ?? tier.baseHours;
  const stations = values.stationCount ?? 1;
  const slotArgs = React.useMemo(
    () => ({ experience, durationHours: duration }),
    [experience, duration],
  );
  const minDate = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return d;
  }, []);
  const selectedDate = values.eventDate ? parseISODate(values.eventDate) : undefined;
  const addlHours = Math.max(0, duration - tier.baseHours);
  const addlRate = tier.additionalHourCents / 100;

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
    if (isDateClosed(occupancy, values.eventDate, slotArgs)) {
      onChange({ eventDate: undefined, eventStartTime: undefined });
      return;
    }
    if (
      values.eventStartTime &&
      !isSlotOpen(occupancy, values.eventDate, values.eventStartTime, slotArgs)
    ) {
      onChange({ eventStartTime: undefined });
    }
  }, [occupancy, slotArgs, values.eventDate, values.eventStartTime]); // eslint-disable-line react-hooks/exhaustive-deps -- onChange is not stable

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[24px] border border-border soft-card p-4 sm:p-6">
        <Label className="label-caps text-[10px] text-muted-foreground">Event date</Label>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="soft-inset mt-2 flex h-14 w-full items-center justify-between gap-3 rounded-[16px] border border-border bg-background px-4 text-left text-base transition-colors hover:border-foreground/30"
            >
              <span className={values.eventDate ? "text-foreground" : "text-muted-foreground"}>
                {values.eventDate ? formatLong(values.eventDate) : "Select your event date"}
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
                (day) => isDateClosed(occupancy, toISODate(day), slotArgs),
              ]}
              onSelect={(d) => {
                const next = d ? toISODate(d) : undefined;
                if (next && isDateClosed(occupancy, next, slotArgs)) return;
                onChange({ eventDate: next, eventStartTime: undefined });
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
              {TIME_SLOTS.map((slot) => {
                const active = values.eventStartTime === slot;
                const open =
                  Boolean(values.eventDate) &&
                  isSlotOpen(occupancy, values.eventDate as string, slot, slotArgs);
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={!open}
                    onClick={() => {
                      if (!open) return;
                      onChange({ eventStartTime: slot });
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
        <p className="mt-2 text-xs text-muted-foreground">Times are Eastern (Miami).</p>
        <FieldError message={errors["eventStartTime"]} />
      </div>

      <Stepper
        label="Duration"
        hint={`${tier.baseHours} hours included. Need us longer? Add what\u2019s needed.`}
        note={
          addlHours > 0
            ? `+${addlHours} hr${addlHours === 1 ? "" : "s"} · $${(addlHours * addlRate).toLocaleString()}`
            : `Additional hours $${addlRate.toLocaleString()}/hr`
        }
        value={duration}
        min={tier.baseHours}
        max={12}
        suffix={duration === 1 ? "hour" : "hours"}
        onChange={(v) => onChange({ durationHours: v })}
      />

      {tier.perStation ? (
        <Stepper
          label="Stations"
          hint="The Miami Luxe is priced per station."
          value={stations}
          min={1}
          max={10}
          suffix={stations === 1 ? "station" : "stations"}
          onChange={(v) => onChange({ stationCount: v })}
        />
      ) : null}
    </div>
  );
}

function Stepper({
  label,
  hint,
  note,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  hint: string;
  note?: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-[24px] border border-border soft-card p-5 sm:p-6">
      <p className="label-caps text-[10px] text-muted-foreground">{label}</p>
      <div className="mt-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-4xl font-semibold leading-none tracking-tight tabular-nums">
            {value}{" "}
            <span className="text-base font-normal text-muted-foreground">{suffix}</span>
          </p>
          {note ? (
            <p className="mt-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {note}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <RoundButton
            aria-label={`Decrease ${label.toLowerCase()}`}
            disabled={value <= min}
            onClick={() => onChange(Math.max(min, value - 1))}
          >
            <Minus className="size-4" aria-hidden="true" />
          </RoundButton>
          <RoundButton
            aria-label={`Increase ${label.toLowerCase()}`}
            disabled={value >= max}
            onClick={() => onChange(Math.min(max, value + 1))}
          >
            <Plus className="size-4" aria-hidden="true" />
          </RoundButton>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
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

export function formatTime(v: string) {
  const [h, m] = v.split(":").map(Number);
  const hour = h ?? 0;
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${`${m ?? 0}`.padStart(2, "0")} ${suffix}`;
}
