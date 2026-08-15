import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";

import { IMAGES } from "@/assets/images";
import { EXPERIENCE_IMAGES } from "@/components/booking/StepExperience";
import { EdCaption, EdPrimaryButton } from "@/components/booking/EditorialCard";
import { formatCents } from "@/config/pricing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout-preview")({
  head: () => ({
    meta: [{ title: "Pay popup layouts — Studio 7 Miami" }],
  }),
  component: CheckoutPreview,
});

const SAMPLE = {
  experienceName: "The Miami Social",
  when: "August 23, 2026 · 7:00 PM",
  imageUrl: EXPERIENCE_IMAGES.social.url,
  totalCents: 50000,
  chargeCents: 25000,
  balanceDue: "August 16, 2026",
};

function CheckoutPreview() {
  return (
    <div className="min-h-svh bg-background px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-3">
        <p className="label-caps text-[10px] text-muted-foreground">Internal preview</p>
        <h1 className="font-display text-3xl tracking-tight">Popup layouts</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Same dense glass. Three arrangements of the pay popup. Live checkout is still the
          narrow stack until you pick.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-6xl space-y-24">
        <Scene
          id="stack"
          letter="A"
          title="Stack"
          note="Narrow column. Amount, then wallets, then card. What’s live now."
        >
          <PageFrame>
            <StackSheet />
          </PageFrame>
        </Scene>
        <Scene
          id="split"
          letter="B"
          title="Split"
          note="Booking and amount on the left. Stripe on the right. Wider popup."
        >
          <PageFrame>
            <SplitSheet />
          </PageFrame>
        </Scene>
        <Scene
          id="dock"
          letter="C"
          title="Dock"
          note="Sits on the bottom of the page. Amount left, pay right — a tray, not a card."
        >
          <PageFrame dock>
            <DockSheet />
          </PageFrame>
        </Scene>
      </div>
    </div>
  );
}

function Scene({
  id,
  letter,
  title,
  note,
  children,
}: {
  id: string;
  letter: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-5">
      <div>
        <p className="label-caps text-[10px] text-muted-foreground">Layout {letter}</p>
        <h2 className="mt-1 font-display text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  );
}

function PageFrame({ children, dock = false }: { children: React.ReactNode; dock?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-border">
      <BookingPageGhost />
      <div
        className={cn(
          "absolute inset-0 bg-foreground/12 backdrop-blur-[8px]",
          dock ? "flex items-end" : "flex items-start justify-center px-4 pt-16 sm:pt-20",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function Glass({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("ed-glass overflow-hidden", className)}>{children}</div>;
}

function Close() {
  return (
    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground">
      <X className="size-4" aria-hidden="true" />
    </span>
  );
}

function StackSheet() {
  return (
    <Glass className="w-full max-w-[420px]">
      <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-7">
        <div>
          <p className="font-display text-lg">{SAMPLE.experienceName}</p>
          <p className="mt-1 text-sm text-muted-foreground">{SAMPLE.when}</p>
        </div>
        <Close />
      </div>
      <div className="ed-hairline mx-6 mt-5 sm:mx-7" />
      <div className="flex items-end justify-between gap-4 px-6 pt-5 sm:px-7">
        <div>
          <p className="label-caps text-[10px] text-muted-foreground">Due now · deposit</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Balance {formatCents(SAMPLE.chargeCents)} · {SAMPLE.balanceDue}
          </p>
        </div>
        <p className="font-display text-4xl leading-none tracking-tight tabular-nums">
          {formatCents(SAMPLE.chargeCents)}
        </p>
      </div>
      <div className="space-y-5 px-6 py-6 sm:px-7">
        <Wallets />
        <OrRule />
        <CardFields />
        <EdPrimaryButton>Pay {formatCents(SAMPLE.chargeCents)}</EdPrimaryButton>
        <EdCaption>Secure checkout · your card is never stored</EdCaption>
      </div>
    </Glass>
  );
}

function SplitSheet() {
  return (
    <Glass className="w-full max-w-[760px]">
      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)]">
        <div className="border-b border-foreground/10 px-7 py-7 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-3">
            <p className="label-caps text-[10px] text-muted-foreground">Studio 7 Miami</p>
            <span className="lg:hidden">
              <Close />
            </span>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <img
              src={SAMPLE.imageUrl}
              alt=""
              className="size-14 rounded-[14px] object-cover"
            />
            <div>
              <p className="font-display text-lg">{SAMPLE.experienceName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{SAMPLE.when}</p>
            </div>
          </div>
          <p className="label-caps mt-8 text-[10px] text-muted-foreground">Due now · deposit</p>
          <p className="mt-2 font-display text-[2.75rem] leading-none tracking-tight tabular-nums">
            {formatCents(SAMPLE.chargeCents)}
          </p>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Booking total</dt>
              <dd className="tabular-nums">{formatCents(SAMPLE.totalCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Balance due</dt>
              <dd className="tabular-nums">{SAMPLE.balanceDue}</dd>
            </div>
          </dl>
        </div>
        <div className="px-7 py-7">
          <div className="mb-5 hidden justify-end lg:flex">
            <Close />
          </div>
          <p className="label-caps text-[10px] text-muted-foreground">Payment</p>
          <p className="mt-1 font-display text-xl">Complete checkout</p>
          <div className="mt-6 space-y-5">
            <Wallets />
            <OrRule />
            <CardFields />
            <EdPrimaryButton>Pay {formatCents(SAMPLE.chargeCents)}</EdPrimaryButton>
            <EdCaption>Secure checkout · your card is never stored</EdCaption>
          </div>
        </div>
      </div>
    </Glass>
  );
}

function DockSheet() {
  return (
    <Glass className="w-full rounded-b-none rounded-t-[28px]">
      <div className="mx-auto flex justify-center pt-3">
        <span className="h-1 w-10 rounded-full bg-foreground/15" />
      </div>
      <div className="grid items-start gap-8 px-6 py-5 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="flex items-start justify-between gap-4 lg:block">
          <div>
            <p className="font-display text-lg">{SAMPLE.experienceName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{SAMPLE.when}</p>
            <p className="label-caps mt-6 text-[10px] text-muted-foreground">Due now · deposit</p>
            <p className="mt-2 font-display text-5xl leading-none tracking-tight tabular-nums">
              {formatCents(SAMPLE.chargeCents)}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {formatCents(SAMPLE.chargeCents)} balance · {SAMPLE.balanceDue}
            </p>
          </div>
          <span className="lg:hidden">
            <Close />
          </span>
        </div>
        <div className="space-y-5 pb-3">
          <div className="hidden justify-end lg:flex">
            <Close />
          </div>
          <Wallets />
          <OrRule />
          <CardFields />
          <EdPrimaryButton>Pay {formatCents(SAMPLE.chargeCents)}</EdPrimaryButton>
          <EdCaption>Secure checkout · your card is never stored</EdCaption>
        </div>
      </div>
    </Glass>
  );
}

function Wallets() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <span className="flex h-11 items-center justify-center rounded-[10px] bg-[#00D66F] text-[11px] font-semibold tracking-wide text-[#003F22]">
        Link
      </span>
      <span className="flex h-11 items-center justify-center rounded-[10px] bg-[#FFD814] text-[11px] font-semibold tracking-wide text-[#111]">
        Amazon
      </span>
    </div>
  );
}

function OrRule() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="label-caps text-[10px] text-muted-foreground">or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function CardFields() {
  return (
    <>
      <MockField label="Card number" value="ACCT-000003" />
      <div className="grid grid-cols-2 gap-4">
        <MockField label="Expiry" value="MM / YY" />
        <MockField label="CVC" value="123" />
      </div>
    </>
  );
}

function MockField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="label-caps text-[10px] text-muted-foreground">{label}</span>
      <span className="mt-2 block w-full border-b border-foreground/10 pb-2 text-base text-muted-foreground">
        {value}
      </span>
    </label>
  );
}

function BookingPageGhost() {
  return (
    <div className="pointer-events-none select-none bg-background px-5 pb-16 pt-3 sm:px-8">
      <div className="flex items-center gap-4 border-b border-border pb-3">
        <img src={IMAGES.logo} alt="" className="h-10 w-auto object-contain sm:h-11" />
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-x-[8%] top-1/2 h-px -translate-y-1/2 bg-[var(--line)]" />
          <div className="absolute left-[8%] top-1/2 h-px w-[68%] -translate-y-1/2 bg-[var(--ink)]" />
          <div className="relative grid grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className="flex justify-center">
                <span className="size-3.5 rounded-full border border-foreground bg-foreground" />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <h2 className="font-display text-2xl">Secure your date</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Lock in your date with a deposit, or pay in full today.
          </p>
          <div className="ed-card mt-6 p-6">
            <div className="flex items-center gap-4">
              <img src={SAMPLE.imageUrl} alt="" className="size-14 rounded-[14px] object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg">{SAMPLE.experienceName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{SAMPLE.when}</p>
              </div>
              <span className="font-display text-lg tabular-nums">
                {formatCents(SAMPLE.totalCents)}
              </span>
            </div>
            <div className="mt-8 h-12 rounded-full bg-foreground" />
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="soft-card rounded-[24px] border border-border p-6">
            <p className="label-caps text-[10px] text-muted-foreground">Your event at a glance</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Package</dt>
                <dd>The Miami Social</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Date</dt>
                <dd>Sun, Aug 23, 2026</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Start</dt>
                <dd>7:00 PM</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
