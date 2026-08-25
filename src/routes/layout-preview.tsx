import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar as CalendarIcon, Check, Clock as ClockIcon, ExternalLink, Shuffle } from "lucide-react";
import { PillButton } from "@/components/booking/StepShell";
import { Stepper } from "@/components/booking/Stepper";
import { IMAGES, STUDIO_IMAGES } from "@/assets/images";
import { SURPRISE_SHOOTER, type BookableShooter } from "@/lib/studio/shooters";
import { STUDIO_STEP_META } from "@/lib/studio/booking-schema";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/layout-preview")({
  head: () => ({
    meta: [{ title: "Shooter layouts — Studio 7 Miami" }],
  }),
  component: LayoutPreview,
});

type Variant = "a" | "b" | "c";

const VARIANTS: [Variant, string][] = [
  ["a", "A · Alternate row"],
  ["b", "B · Footer pill"],
  ["c", "C · Text action"],
];

const ANYONE = {
  id: SURPRISE_SHOOTER.id,
  label: "Anyone available",
  hint: "We'll assign whoever's free",
} as const;

const SAMPLE: BookableShooter[] = [
  {
    id: "lawensky",
    name: "Lawensky",
    initials: "L",
    portfolioUrl: "https://studio7.miami",
    avatarUrl: null,
  },
  {
    id: "shanyia",
    name: "Shanyia Baker",
    initials: "SB",
    portfolioUrl: "https://studio7.miami",
    avatarUrl: null,
  },
  {
    id: "joshua",
    name: "Joshua F",
    initials: "JF",
    portfolioUrl: "https://studio7.miami",
    avatarUrl: null,
  },
];

function LayoutPreview() {
  const [variant, setVariant] = useState<Variant>("b");
  const [shooterId, setShooterId] = useState("shanyia");
  const selectedName =
    shooterId === ANYONE.id
      ? ANYONE.label
      : (SAMPLE.find((s) => s.id === shooterId)?.name ?? SAMPLE[1]!.name);

  return (
    <div className="min-h-svh bg-background">
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="label-caps text-[10px] text-muted-foreground">Internal preview</p>
            <p className="truncate text-sm">Name rows — no photos. Anyone-available is labeled, not a mystery icon.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {VARIANTS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setVariant(id)}
                className={cn(
                  "label-caps rounded-full border px-3 py-1.5 text-[10px] transition-colors",
                  variant === id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Link
            to="/"
            className="label-caps text-[10px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Back to booking
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-5">
        <div className="mb-4 flex items-center gap-4">
          <img
            src={IMAGES.logo}
            alt="Studio 7 Miami"
            className="h-11 w-auto shrink-0 object-contain sm:h-12"
          />
          <Stepper step={2} steps={STUDIO_STEP_META} />
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="overflow-hidden rounded-[24px] border border-border leading-[0]">
            <img src={STUDIO_IMAGES.portraits} alt="" className="block w-full" />
          </div>
          <div className="flex min-w-0 flex-col lg:self-stretch">
            <h1 className="text-[1.35rem] leading-[1.1] sm:text-[1.75rem]">Pick your time</h1>
            <p className="mt-1.5 text-[0.95rem] text-muted-foreground sm:text-base">
              Only open times are shown. Then choose who photographs you.
            </p>
            <div className="mt-5 space-y-4">
              <FakeField label="Session date" value="Tuesday, August 25, 2026" icon="cal" />
              <FakeField label="Start time" value="11:00 AM" icon="clock" />
              {variant === "a" ? (
                <AlternateRow shooterId={shooterId} onSelect={setShooterId} />
              ) : null}
              {variant === "b" ? (
                <FooterPill shooterId={shooterId} onSelect={setShooterId} />
              ) : null}
              {variant === "c" ? (
                <TextAction shooterId={shooterId} onSelect={setShooterId} />
              ) : null}
            </div>
            <div className="hidden lg:block lg:min-h-6 lg:flex-1" aria-hidden="true" />
            <div className="mt-6 hidden border-t border-border pt-5 lg:mt-0 lg:block">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="label-caps text-[10px] text-muted-foreground">Portraits</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    1 hr 30 min · {selectedName} · Tue, Aug 25
                  </p>
                </div>
                <p className="font-display text-2xl tabular-nums">$250</p>
              </div>
              <div className="mt-5">
                <PillButton onClick={() => undefined}>Continue</PillButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FakeField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: "cal" | "clock";
}) {
  return (
    <div className="rounded-[24px] border border-border soft-card p-4 sm:p-6">
      <p className="label-caps text-[10px] text-muted-foreground">{label}</p>
      <div className="soft-inset mt-2 flex h-14 w-full items-center justify-between gap-3 rounded-[16px] border border-border bg-background px-4 text-left text-base">
        <span>{value}</span>
        {icon === "cal" ? (
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ClockIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

function AlternateRow({
  shooterId,
  onSelect,
}: {
  shooterId: string;
  onSelect: (id: string) => void;
}) {
  const anyone = shooterId === ANYONE.id;
  return (
    <Panel>
      <div className="space-y-2">
        {SAMPLE.map((shooter) => (
          <NameRow
            key={shooter.id}
            shooter={shooter}
            selected={shooterId === shooter.id}
            onSelect={() => onSelect(shooter.id)}
          />
        ))}
        <button
          type="button"
          onClick={() => onSelect(ANYONE.id)}
          aria-pressed={anyone}
          className={cn(
            "flex w-full items-center gap-3 rounded-[16px] border border-dashed px-4 py-3.5 text-left transition-colors",
            anyone
              ? "border-foreground bg-foreground text-background"
              : "border-border hover:border-foreground/40",
          )}
        >
          <span
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
              anyone ? "bg-background/15" : "bg-muted",
            )}
          >
            <Shuffle className="size-3.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-sm leading-tight">{ANYONE.label}</span>
            <span className={cn("mt-0.5 block text-[11px]", anyone ? "text-background/80" : "text-muted-foreground")}>
              {ANYONE.hint}
            </span>
          </span>
          <span
            className={cn(
              "inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-background text-foreground",
              anyone ? "visible" : "invisible",
            )}
            aria-hidden="true"
          >
            <Check className="size-3" strokeWidth={3} />
          </span>
        </button>
      </div>
    </Panel>
  );
}

function FooterPill({
  shooterId,
  onSelect,
}: {
  shooterId: string;
  onSelect: (id: string) => void;
}) {
  const anyone = shooterId === ANYONE.id;
  return (
    <Panel>
      <div className="space-y-2">
        {SAMPLE.map((shooter) => (
          <NameRow
            key={shooter.id}
            shooter={shooter}
            selected={shooterId === shooter.id}
            onSelect={() => onSelect(shooter.id)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => onSelect(ANYONE.id)}
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
    </Panel>
  );
}

function TextAction({
  shooterId,
  onSelect,
}: {
  shooterId: string;
  onSelect: (id: string) => void;
}) {
  const anyone = shooterId === ANYONE.id;
  return (
    <Panel>
      <div className="divide-y divide-border border-y border-border">
        {SAMPLE.map((shooter) => {
          const selected = shooterId === shooter.id;
          return (
            <button
              key={shooter.id}
              type="button"
              onClick={() => onSelect(shooter.id)}
              aria-pressed={selected}
              className="flex w-full items-center gap-3 py-3.5 text-left transition-colors hover:text-foreground"
            >
              <span
                className={cn(
                  "min-w-0 flex-1 font-display text-sm leading-tight",
                  selected ? "text-foreground" : "text-foreground/80",
                )}
              >
                {shooter.name}
              </span>
              <ViewWorkIcon href={shooter.portfolioUrl} />
              <span
                className={cn(
                  "inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background",
                  selected ? "visible" : "invisible",
                )}
                aria-hidden="true"
              >
                <Check className="size-3" strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onSelect(ANYONE.id)}
        aria-pressed={anyone}
        className={cn(
          "mt-4 inline-flex items-center gap-2 text-sm transition-colors",
          anyone ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Shuffle className="size-3.5 shrink-0" />
        <span className={anyone ? "underline underline-offset-4" : undefined}>
          Assign whoever's available
        </span>
        {anyone ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </button>
    </Panel>
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
        <ViewWork selected={selected} href={shooter.portfolioUrl} />
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

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-border soft-card p-5 sm:p-6">
      <p className="label-caps text-[10px] text-muted-foreground">Select your shooter</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick who photographs this session, or leave it open.
      </p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ViewWork({ href, selected }: { href: string | null; selected: boolean }) {
  if (!href) return null;
  return (
    <a
      href={href}
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
  );
}

function ViewWorkIcon({ href }: { href: string | null }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      aria-label="View work"
      title="View work"
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
    >
      <ExternalLink className="size-3.5" />
    </a>
  );
}
