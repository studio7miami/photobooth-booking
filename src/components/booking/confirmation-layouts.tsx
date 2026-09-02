import { Fragment, type ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";

import { IMAGES } from "@/assets/images";
import { formatCents, formatPaidTotal } from "@/config/pricing";
import { offeringImageFocusClass } from "@/components/studio/StepOffering";
import { formatAddressLines, formatEmail, formatName, formatPhone } from "@/lib/format-display";
import { cn } from "@/lib/utils";
import { EdCard } from "./EditorialCard";
import { OrderLine, formatLongDate } from "./StepPayment";
import { formatTime } from "./StepTime";

export const CONFIRMATION_TITLE = "You're all set";
export const CONFIRMATION_BODY =
  "Your date is secured and we look forward to bringing the booth to your event. Your agreement, receipt, and event details will land in your inbox soon.";
export const STUDIO_CONFIRMATION_BODY =
  "Your session is booked. Your agreement, receipt, and details will land in your inbox soon.";
export const CLASS_CONFIRMATION_BODY =
  "Your seat is booked. Your receipt and class details will land in your inbox soon.";

export type ConfirmationModel = {
  settled: boolean;
  experienceName: string | null;
  imageUrl?: string | undefined;
  eventDate?: string | undefined;
  eventStartTime?: string | undefined;
  totalCents: number;
  paidCents?: number;
  paidOn: string | null;
  isDeposit: boolean;
  balanceCents: number | null;
  dueLabel: string | null;
  clientName?: string | undefined;
  clientEmail?: string | undefined;
  clientPhone?: string | undefined;
  eventLocation?: string | undefined;
  kind?: "photobooth" | "studio" | "class";
};

function Logo({ kind }: { kind?: ConfirmationModel["kind"] }) {
  const photobooth = kind === "photobooth";
  return (
    <div className="relative mb-3 h-12 sm:mb-4 sm:h-14">
      <img
        src={photobooth ? IMAGES.photoboothLogo : IMAGES.logo}
        alt={photobooth ? "Studio 7 Photobooth" : "Studio 7 Miami"}
        className="absolute bottom-0 left-1/2 h-16 w-auto -translate-x-1/2 bg-transparent object-contain sm:h-[4.5rem]"
      />
    </div>
  );
}

function StatusMark({ settled }: { settled: boolean }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground">
      {settled ? (
        <Check className="size-3.5 text-background" aria-hidden="true" />
      ) : (
        <Loader2 className="size-3.5 animate-spin text-background" aria-hidden="true" />
      )}
    </span>
  );
}

function locationLines(model: ConfirmationModel): string[] {
  return model.eventLocation ? formatAddressLines(model.eventLocation) : [];
}

function clock(model: ConfirmationModel): string | null {
  return model.eventStartTime ? formatTime(model.eventStartTime.slice(0, 5)) : null;
}

function Header({ model }: { model: ConfirmationModel }) {
  return (
    <>
      <div className="flex items-center gap-2.5">
        <StatusMark settled={model.settled} />
        <h2 className="font-display text-xl leading-none">
          {model.settled ? CONFIRMATION_TITLE : "Confirming your payment"}
        </h2>
      </div>
      <p className="mt-3 text-sm leading-snug text-muted-foreground">
        {model.settled
          ? model.kind === "class"
            ? CLASS_CONFIRMATION_BODY
            : model.kind === "studio"
              ? STUDIO_CONFIRMATION_BODY
              : CONFIRMATION_BODY
          : "We're waiting for the payment confirmation from our processor. This usually takes a few seconds."}
      </p>
    </>
  );
}

function PackageRow({ model }: { model: ConfirmationModel }) {
  return (
    <div className="ed-hairline mt-5 pt-5 pb-2">
      <OrderLine
        {...(model.experienceName ? { experienceName: model.experienceName } : {})}
        {...(model.imageUrl ? { imageUrl: model.imageUrl } : {})}
        totalCents={model.totalCents}
        amountLabel={formatPaidTotal({
          isDeposit: model.isDeposit,
          paidCents: model.paidCents ?? model.totalCents - (model.balanceCents ?? 0),
          balanceCents: model.balanceCents,
        })}
        done={model.settled}
      />
    </div>
  );
}

function EventSummary({ model }: { model: ConfirmationModel }) {
  const lines = locationLines(model);
  const rows: { label: string; value: ReactNode }[] = [];
  if (model.eventDate) rows.push({ label: "Date", value: formatLongDate(model.eventDate) });
  if (clock(model)) rows.push({ label: "Time", value: clock(model) });
  if (lines.length) {
    rows.push({
      label: "Location",
      value: (
        <span className="block">
          {lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </span>
      ),
    });
  }
  if (model.clientName) rows.push({ label: "Name", value: formatName(model.clientName) });
  if (model.clientEmail) rows.push({ label: "Email", value: formatEmail(model.clientEmail) });
  if (model.clientPhone) rows.push({ label: "Phone", value: formatPhone(model.clientPhone) });
  if (model.paidOn) rows.push({ label: "Paid", value: model.paidOn });
  if (!rows.length) return null;
  return (
    <dl className="mt-4">
      {rows.map((row) => (
        <div
          key={row.label}
          className="ed-hairline flex items-baseline justify-between gap-4 py-2 last:border-b-0"
        >
          <dt className="label-caps shrink-0 text-[10px] text-muted-foreground">{row.label}</dt>
          <dd className="text-right text-sm leading-snug">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function BalanceBlock({ model }: { model: ConfirmationModel }) {
  if (!model.settled || !model.isDeposit || !model.balanceCents) return null;
  return (
    <div className="mt-1">
      <div className="ed-hairline flex items-baseline justify-between gap-2 py-2">
        <span className="label-caps shrink-0 text-[9px] text-muted-foreground sm:text-[10px]">
          Balance remaining
        </span>
        <span className="whitespace-nowrap text-right text-[11px] sm:text-sm">
          <span className="font-display tabular-nums">{formatCents(model.balanceCents)}</span>
          {model.dueLabel ? (
            <span className="ml-1.5 text-muted-foreground">due {model.dueLabel}</span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

/** Tight receipt: status, event, paid stamp. Fits one viewport. */
export function ConfirmationReceipt({ model }: { model: ConfirmationModel }) {
  return (
    <div className="w-full max-w-lg">
      <Logo kind={model.kind} />
      <EdCard className="p-5 sm:p-6">
        <Header model={model} />
        <PackageRow model={model} />
        <EventSummary model={model} />
        <BalanceBlock model={model} />
      </EdCard>
    </div>
  );
}

/** Event on one side, contact on the other — paired rows so left and right stay even. */
export function ConfirmationGrouped({ model }: { model: ConfirmationModel }) {
  return (
    <div className="w-full max-w-xl">
      <Logo kind={model.kind} />
      <EdCard className="p-5 sm:p-6">
        <Header model={model} />
        <PackageRow model={model} />
        <EvenColumns model={model} />
        <BalanceBlock model={model} />
      </EdCard>
    </div>
  );
}

function EvenColumns({ model }: { model: ConfirmationModel }) {
  const date = model.eventDate ? formatLongDate(model.eventDate) : null;
  const time = clock(model);
  const when = date && time ? `${date} · ${time}` : (date ?? time);

  const left = [when, ...locationLines(model)].filter((line): line is string => Boolean(line));

  const right = [
    model.clientName ? formatName(model.clientName) : null,
    model.clientEmail ? formatEmail(model.clientEmail) : null,
    model.clientPhone ? formatPhone(model.clientPhone) : null,
    model.paidOn ? `Paid ${model.paidOn}` : null,
  ].filter((line): line is string => Boolean(line));

  const rows = Math.max(left.length, right.length);

  return (
    <div className="mt-5">
      <div className="grid grid-cols-2 gap-x-8">
        <p className="label-caps text-[10px] text-muted-foreground">Your event</p>
        <p className="label-caps text-[10px] text-muted-foreground">Your details</p>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-8">
        {Array.from({ length: rows }, (_, i) => (
          <Fragment key={i}>
            <p
              className={`text-sm leading-6 ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}
            >
              {left[i] ?? "\u00a0"}
            </p>
            <p
              className={`text-sm leading-6 ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}
            >
              {right[i] ?? "\u00a0"}
            </p>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function EventStack({
  model,
  displayDate = false,
}: {
  model: ConfirmationModel;
  displayDate?: boolean;
}) {
  const lines = locationLines(model);
  const time = clock(model);
  return (
    <div>
      <p className="label-caps text-[10px] text-muted-foreground">Your event</p>
      {model.eventDate ? (
        <p className={displayDate ? "mt-2 font-display text-lg leading-snug" : "mt-2 text-sm"}>
          {formatLongDate(model.eventDate)}
        </p>
      ) : null}
      {time ? <p className="mt-1 text-sm text-muted-foreground">{time}</p> : null}
      {lines.map((line) => (
        <p key={line} className="mt-1 text-sm text-muted-foreground">
          {line}
        </p>
      ))}
    </div>
  );
}

function DetailsStack({ model, paid = false }: { model: ConfirmationModel; paid?: boolean }) {
  return (
    <div>
      <p className="label-caps text-[10px] text-muted-foreground">Your details</p>
      {model.clientName ? <p className="mt-2 text-sm">{formatName(model.clientName)}</p> : null}
      {model.clientEmail ? (
        <p className="mt-1 text-sm text-muted-foreground">{formatEmail(model.clientEmail)}</p>
      ) : null}
      {model.clientPhone ? (
        <p className="mt-1 text-sm text-muted-foreground">{formatPhone(model.clientPhone)}</p>
      ) : null}
      {paid && model.paidOn ? (
        <p className="mt-3 text-sm text-muted-foreground">Paid {model.paidOn}</p>
      ) : null}
    </div>
  );
}

/** Same split, each stack in a soft panel. */
export function ConfirmationGroupedPanels({ model }: { model: ConfirmationModel }) {
  return (
    <div className="w-full max-w-xl">
      <Logo kind={model.kind} />
      <EdCard className="p-5 sm:p-6">
        <Header model={model} />
        <PackageRow model={model} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[16px] bg-muted/50 px-4 py-4">
            <EventStack model={model} />
          </div>
          <div className="rounded-[16px] bg-muted/50 px-4 py-4">
            <DetailsStack model={model} paid />
          </div>
        </div>
        <BalanceBlock model={model} />
      </EdCard>
    </div>
  );
}

/** Date reads larger on the event side. Paid sits as a full-width footer. */
export function ConfirmationGroupedDisplay({ model }: { model: ConfirmationModel }) {
  return (
    <div className="w-full max-w-xl">
      <Logo kind={model.kind} />
      <EdCard className="p-5 sm:p-6">
        <Header model={model} />
        <PackageRow model={model} />
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <EventStack model={model} displayDate />
          <DetailsStack model={model} />
        </div>
        {model.paidOn ? (
          <p className="label-caps mt-5 text-[10px] text-muted-foreground">Paid {model.paidOn}</p>
        ) : null}
        <BalanceBlock model={model} />
      </EdCard>
    </div>
  );
}

/** Vertical hairline between the two stacks. */
export function ConfirmationGroupedRule({ model }: { model: ConfirmationModel }) {
  return (
    <div className="w-full max-w-xl">
      <Logo kind={model.kind} />
      <EdCard className="p-5 sm:p-6">
        <Header model={model} />
        <PackageRow model={model} />
        <div className="mt-5 grid sm:grid-cols-2">
          <div className="sm:pr-6">
            <EventStack model={model} />
          </div>
          <div className="mt-6 border-t border-border pt-6 sm:mt-0 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <DetailsStack model={model} paid />
          </div>
        </div>
        <BalanceBlock model={model} />
      </EdCard>
    </div>
  );
}

/** The night is the stub. Contact stays a quiet caption under the confirmation. */
export function ConfirmationTicket({ model }: { model: ConfirmationModel }) {
  const lines = locationLines(model);
  const time = clock(model);
  const when = [model.eventDate ? formatLongDate(model.eventDate) : null, time]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="w-full max-w-3xl">
      <Logo kind={model.kind} />
      <EdCard className="overflow-hidden p-0">
        <div className="grid sm:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="p-5 sm:p-6">
            <Header model={model} />
            {model.clientName || model.clientEmail || model.clientPhone ? (
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {[
                  model.clientName ? formatName(model.clientName) : null,
                  model.clientEmail ? formatEmail(model.clientEmail) : null,
                  model.clientPhone ? formatPhone(model.clientPhone) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
            {model.paidOn ? (
              <p className="label-caps mt-4 text-[10px] text-muted-foreground">
                Paid {model.paidOn}
              </p>
            ) : null}
            <BalanceBlock model={model} />
          </div>
          <div className="border-t border-border bg-muted/40 sm:border-t-0 sm:border-l">
            {model.imageUrl ? (
              <img
                src={model.imageUrl}
                alt=""
                className={
                  model.imageUrl.includes("framehaus-media")
                    ? "h-28 w-full object-contain bg-background p-4 sm:h-32"
                    : cn(
                        "h-28 w-full object-cover sm:h-32",
                        offeringImageFocusClass(model.imageUrl) ?? "object-center",
                      )
                }
              />
            ) : null}
            <div className="p-5 sm:p-6">
              <p className="label-caps text-[10px] text-muted-foreground">Your event</p>
              <p className="mt-2 font-display text-xl leading-tight">
                {model.experienceName ?? "Studio 7 booking"}
              </p>
              {when ? <p className="mt-2 text-sm">{when}</p> : null}
              {lines.map((line) => (
                <p key={line} className="mt-1 text-sm text-muted-foreground">
                  {line}
                </p>
              ))}
              <p className="mt-4 font-display text-2xl tabular-nums">
                {formatCents(model.totalCents)}
              </p>
            </div>
          </div>
        </div>
      </EdCard>
    </div>
  );
}

/** Date and time lead. Everything else reads as a short note, not a form. */
export function ConfirmationNarrative({ model }: { model: ConfirmationModel }) {
  const lines = locationLines(model);
  const time = clock(model);
  return (
    <div className="w-full max-w-lg">
      <Logo kind={model.kind} />
      <EdCard className="p-5 sm:p-6">
        <Header model={model} />
        <PackageRow model={model} />
        <div className="mt-5">
          {model.eventDate ? (
            <p className="font-display text-lg leading-snug">
              {formatLongDate(model.eventDate)}
              {time ? ` at ${time}` : ""}
            </p>
          ) : null}
          {lines.length ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{lines.join(", ")}</p>
          ) : null}
          {model.clientName ? (
            <p className="mt-4 text-sm">
              {formatName(model.clientName)}
              {model.clientEmail ? (
                <span className="text-muted-foreground"> · {formatEmail(model.clientEmail)}</span>
              ) : null}
            </p>
          ) : null}
          {model.clientPhone ? (
            <p className="mt-1 text-sm text-muted-foreground">{formatPhone(model.clientPhone)}</p>
          ) : null}
          {model.paidOn ? (
            <p className="label-caps mt-4 text-[10px] text-muted-foreground">Paid {model.paidOn}</p>
          ) : null}
        </div>
        <BalanceBlock model={model} />
      </EdCard>
    </div>
  );
}
