import { createFileRoute } from "@tanstack/react-router";

import { EXPERIENCE_IMAGES } from "@/components/booking/StepExperience";
import {
  ConfirmationGrouped,
  ConfirmationGroupedDisplay,
  ConfirmationGroupedPanels,
  ConfirmationGroupedRule,
  type ConfirmationModel,
} from "@/components/booking/confirmation-layouts";

export const Route = createFileRoute("/booked-preview")({
  head: () => ({
    meta: [{ title: "Confirmation layouts — Studio 7 Miami" }],
  }),
  component: BookedPreview,
});

const SAMPLE: ConfirmationModel = {
  settled: true,
  experienceName: "The Miami Classic",
  imageUrl: EXPERIENCE_IMAGES.classic.url,
  eventDate: "2026-08-22",
  eventStartTime: "21:00",
  totalCents: 25000,
  paidOn: "August 15, 2026",
  isDeposit: false,
  balanceCents: 0,
  dueLabel: null,
  clientName: "Camila Reyes",
  clientEmail: "camila.reyes@email.com",
  clientPhone: "3055550147",
  eventLocation: "Studio 7 Miami — 638 NW 62nd St, Miami, FL",
};

function BookedPreview() {
  return (
    <div className="min-h-svh bg-background px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="label-caps text-[10px] text-muted-foreground">Internal preview</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">Grouped layouts</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Same split as B: your event / your details. Four ways to draw the two stacks.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-5xl space-y-20">
        <Scene
          letter="B"
          title="Open stacks"
          note="The original. Two columns, no extra chrome."
        >
          <Frame>
            <ConfirmationGrouped model={SAMPLE} />
          </Frame>
        </Scene>
        <Scene
          letter="B2"
          title="Panels"
          note="Each stack sits in a soft panel so the two sides read as cards."
        >
          <Frame>
            <ConfirmationGroupedPanels model={SAMPLE} />
          </Frame>
        </Scene>
        <Scene
          letter="B3"
          title="Display date"
          note="Event date is set in the display face. Paid is a footer under both columns."
        >
          <Frame>
            <ConfirmationGroupedDisplay model={SAMPLE} />
          </Frame>
        </Scene>
        <Scene
          letter="B4"
          title="Rule"
          note="A hairline between the stacks, like a split page."
        >
          <Frame>
            <ConfirmationGroupedRule model={SAMPLE} />
          </Frame>
        </Scene>
      </div>
    </div>
  );
}

function Scene({
  letter,
  title,
  note,
  children,
}: {
  letter: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div>
        <p className="label-caps text-[10px] text-muted-foreground">Layout {letter}</p>
        <h2 className="mt-1 font-display text-2xl">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-background">
      <div className="flex justify-center px-4 py-8 sm:px-8 sm:py-10">{children}</div>
    </div>
  );
}
