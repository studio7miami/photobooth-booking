import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Lock } from "lucide-react";
import {
  EXPERIENCES,
  calculatePrice,
  type ExperienceKey,
} from "@/config/pricing";
import {
  bookingDetailsSchema,
  stepDetailsSchema,
  stepExperienceSchema,
  stepTimeSchema,
  type BookingDetails,
  type BookingDraft,
} from "@/lib/booking-schema";
import { finalizeSignatureSchema } from "@/lib/agreement-schema";
import { finalizeSignature } from "@/lib/agreement.functions";
import { clearDraft, loadDraft, saveDraft, type StoredSigned } from "@/lib/booking-draft";
import { isHoldActive } from "@/lib/hold";
import { getStripe } from "@/lib/stripe";
import { StepShell } from "./StepShell";
import { EXPERIENCE_IMAGES, StepExperience } from "./StepExperience";
import { StepTime } from "./StepTime";
import { StepDetails } from "./StepDetails";
import { StepAgreement, CheckRow, type AgreementValues } from "./StepAgreement";
import { StepPayment } from "./StepPayment";
import { PaymentConfirmation } from "./PaymentConfirmation";

import { EventGlance } from "./EventGlance";

type Errors = Record<string, string | undefined>;

type SignedRecord = StoredSigned;

const COPY = [
  {
    title: "Book your experience",
    supporting: "Select the setup that fits your event and vision.",
  },
  {
    title: "Pick your time",
    supporting: "Tell us when the room fills up. Pricing updates as you go.",
  },
  {
    title: "Event information",
    supporting: "The essentials so our team can plan your load-in and setup.",
  },
  {
    title: "Review & sign",
    supporting: "You're one signature from booked. Read it through, then sign below.",
  },
  {
    title: "Secure your date",
    supporting: "Lock in your date with a deposit, or pay in full today. It's confirmed the moment payment clears.",
  },
] as const;

const LAST_STEP = 5;
const SIGN_STEP = 4;

export function BookingFlow() {
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<BookingDraft>({});
  const [agreement, setAgreement] = useState<AgreementValues>({});
  const [errors, setErrors] = useState<Errors>({});
  const [resumed, setResumed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [signed, setSigned] = useState<SignedRecord | null>(null);
  const [paidBookingId, setPaidBookingId] = useState<string | null>(null);

  const sign = useServerFn(finalizeSignature);

  useEffect(() => {
    if (step >= SIGN_STEP) void getStripe();
  }, [step]);

  // Resume an autosaved draft (client-only).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returning = params.get("booking");
    if (returning && params.get("paid")) {
      setPaidBookingId(returning);
      clearDraft();
      setHydrated(true);
      return;
    }
    const draft = loadDraft();
    if (draft) {
      const v = { ...draft.values };
      if (v.experience && !EXPERIENCES[v.experience]) {
        delete v.experience;
      }
      setValues(v);
      if (draft.signed?.booking_id && isHoldActive(draft.signed.signed_at)) {
        setSigned(draft.signed);
        setStep(5);
      } else {
        setStep(Math.min(Math.max(draft.step, 1), SIGN_STEP));
      }
      setResumed(true);
    }
    setHydrated(true);
  }, []);

  // Autosave on every change once hydrated.
  useEffect(() => {
    if (!hydrated) return;
    if (Object.keys(values).length === 0) return;
    saveDraft(step, values, { signed });
  }, [hydrated, step, values, signed]);

  useEffect(() => {
    if (resumed) {
      toast("Welcome back — we saved your progress.");
      setResumed(false);
    }
  }, [resumed]);

  const releaseHold = useCallback(() => {
    setSigned(null);
    toast("Your 10-minute hold ended. Sign again to reserve this time.");
  }, []);

  const patch = (p: BookingDraft) => {
    setValues((v) => ({ ...v, ...p }));
    setErrors({});
    if (signed) {
      setSigned(null);
    }
  };

  const price = useMemo(() => {
    if (!values.experience) return null;
    const tier = EXPERIENCES[values.experience];
    if (!tier) return null;
    return calculatePrice({
      experience: values.experience,
      durationHours: values.durationHours ?? tier.baseHours,
      stationCount: values.stationCount ?? 1,
    });
  }, [values.experience, values.durationHours, values.stationCount]);

  const fullBooking = useMemo(() => {
    const result = bookingDetailsSchema.safeParse(values);
    return result.success ? (result.data as BookingDetails) : null;
  }, [values]);

  const copy = COPY[Math.min(step, LAST_STEP) - 1]!;

  function collectIssues(issues: { path: PropertyKey[]; message: string }[]): Errors {
    const next: Errors = {};
    for (const issue of issues) {
      const key = String(issue.path[0] ?? "form");
      if (!next[key]) next[key] = issue.message; // keep the first, most relevant message
    }
    return next;
  }

  async function submitSignature() {
    if (!fullBooking) {
      toast("Some event details are missing — please step back and complete them.");
      return;
    }
    const parsed = finalizeSignatureSchema.safeParse({
      booking: fullBooking,
      signerName: agreement.signerName ?? "",
      signatureValue: agreement.signatureValue ?? "",
      consent: agreement.consent ?? false,
      marketingOptIn: agreement.marketingOptIn ?? false,
    });
    if (!parsed.success) {
      setErrors(collectIssues(parsed.error.issues));
      toast("Please complete the signature section.");
      return;
    }

    setSubmitting(true);
    try {
      const record = await sign({ data: parsed.data });
      const signedRecord: StoredSigned = {
        booking_id: record.booking_id,
        total_cents: record.total_cents,
        signed_at: record.signed_at,
        agreement_template_version: record.agreement_template_version,
        agreement_content_hash: record.agreement_content_hash,
        deposit_cents: record.deposit_cents,
        balance_cents: record.balance_cents,
        balance_due_date: record.balance_due_date,
      };
      setSigned(signedRecord);
      setStep(5);
      saveDraft(5, values, { signed: signedRecord });
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast("Agreement signed. Payment unlocks next.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast(
        message.includes("available")
          ? message
          : "We couldn't record your signature. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function validateAndAdvance() {
    if (step === SIGN_STEP) {
      if (signed) {
        setStep(5);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      void submitSignature();
      return;
    }
    if (step === LAST_STEP) return;

    const schema =
      step === 1 ? stepExperienceSchema : step === 2 ? stepTimeSchema : stepDetailsSchema;

    const input =
      step === 1
        ? { experience: values.experience }
        : step === 2
          ? {
              eventDate: values.eventDate ?? "",
              eventStartTime: values.eventStartTime ?? "",
              durationHours:
                values.durationHours ??
                EXPERIENCES[values.experience as ExperienceKey]?.baseHours ??
                2,
              stationCount: values.stationCount ?? null,
            }
          : {
              clientName: values.clientName ?? "",
              clientPhone: values.clientPhone ?? "",
              clientEmail: values.clientEmail ?? "",
              eventLocation: values.eventLocation ?? "",
              eventType: values.eventType ?? "",
            };

    if (step === 3 && !agreement.detailsConfirmed) {
      toast("Please confirm your details are correct to continue.");
      return;
    }

    const result = schema.safeParse(input);
    if (!result.success) {
      setErrors(collectIssues(result.error.issues));
      if (step === 1) toast("Choose an experience to continue.");
      return;
    }

    setErrors({});
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!hydrated) {
    return <div className="min-h-svh bg-background" />;
  }

  if (paidBookingId) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <PaymentConfirmation bookingId={paidBookingId} />
      </div>
    );
  }

  const canAdvance =
    step === 1
      ? Boolean(values.experience)
      : step === 2
        ? Boolean(values.eventDate && values.eventStartTime)
        : step === 3
          ? !addressLoading
          : step === 4
            ? !submitting
            : step === 5
              ? false
              : true;

  const glanceProps = {
    experience: values.experience,
    eventDate: values.eventDate,
    eventStartTime: values.eventStartTime,
    durationHours: values.durationHours,
    stationCount: values.stationCount,
    ...(step >= 4 && values.eventLocation ? { eventLocation: values.eventLocation } : {}),
    ...(price ? { price } : {}),
    ...(signed ? { holdSignedAt: signed.signed_at, onHoldExpired: releaseHold } : {}),
    onContinue: validateAndAdvance,
    disabled: !canAdvance,
    cta:
      step === 5
        ? "Complete payment below"
        : step === 3
          ? "Continue to review & sign"
          : step === 4
            ? signed
              ? "Continue to payment"
              : submitting
                ? "Signing…"
                : "Sign & continue"
            : "Continue",
  };

  return (
    <StepShell
      step={step}
      title={copy.title}
      supporting={copy.supporting}
      {...(step > 1
        ? {
            onBack: () => {
              setErrors({});
              setStep(step - 1);
            },
          }
        : {})}
      {...(step > 1 ? { aside: <EventGlance {...glanceProps} /> } : {})}
      footer={<EventGlance {...glanceProps} compact />}
    >
      {step === 1 ? (
        <StepExperience
          {...(values.experience ? { value: values.experience } : {})}
          onChange={(experience) =>
            patch({
              experience,
              durationHours: EXPERIENCES[experience].baseHours,
              stationCount: EXPERIENCES[experience].perStation ? (values.stationCount ?? 1) : null,
            })
          }
        />
      ) : null}

      {step === 2 && values.experience ? (
        <StepTime
          experience={values.experience}
          values={values}
          errors={errors}
          onChange={patch}
          {...(signed?.booking_id ? { excludeBookingId: signed.booking_id } : {})}
        />
      ) : null}

      {step === 3 ? (
        <div className="space-y-6">
          <StepDetails
            values={values}
            errors={errors}
            onChange={patch}
            onAddressLoadingChange={setAddressLoading}
          />
          <CheckRow
            checked={Boolean(agreement.detailsConfirmed)}
            onToggle={() => {
              setAgreement((a) => ({ ...a, detailsConfirmed: !a.detailsConfirmed }));
              setErrors({});
            }}
            label="I've reviewed my details and they're correct."
          />
        </div>
      ) : null}

      {step === 4 ? (
        fullBooking ? (
          <div className="space-y-6">
            <StepAgreement
              booking={fullBooking}
              values={agreement}
              errors={errors}
              onChange={(p) => {
                setAgreement((a) => ({ ...a, ...p }));
                setErrors({});
              }}
            />
          </div>
        ) : (
          <p className="soft-card rounded-[24px] border border-border p-6 text-sm text-muted-foreground">
            Some event details are still missing. Step back and complete them to see your
            agreement.
          </p>
        )
      ) : null}

      {step === 5 ? (
        signed ? (
          <div className="space-y-6">
            <SignedReceipt record={signed} />
            <StepPayment
              bookingId={signed.booking_id}
              {...(values.experience && EXPERIENCES[values.experience]
                ? {
                    experienceName: EXPERIENCES[values.experience].name,
                    imageUrl: EXPERIENCE_IMAGES[values.experience].url,
                  }
                : {})}
              {...(values.eventDate ? { eventDate: values.eventDate } : {})}
              {...(values.eventStartTime ? { eventStartTime: values.eventStartTime } : {})}
              totalCents={signed.total_cents}
              depositCents={signed.deposit_cents}
              balanceCents={signed.balance_cents}
              balanceDueDate={signed.balance_due_date}
            />
          </div>
        ) : (
          <p className="soft-card rounded-[24px] border border-border p-6 text-sm text-muted-foreground">
            Sign the agreement to unlock payment.
          </p>
        )
      ) : null}
    </StepShell>
  );
}

function SignedReceipt(_: { record: SignedRecord }) {
  return (
    <div className="soft-inset flex items-start gap-3 rounded-[16px] border border-border p-5">
      <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        Your date is held. Payment confirms the booking — choose deposit or pay in full below.
      </p>
    </div>
  );
}
