import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Lock } from "lucide-react";
import { INACTIVITY_MINUTES } from "@/config/booking-rules";
import { STUDIO_LOCATION } from "@/config/studio/booking-rules";
import {
  calculateStudioPrice,
  STUDIO_OFFERINGS,
  type StudioOfferingKey,
} from "@/config/studio/offerings";
import { renderStudioAgreement, STUDIO_CONSENT_LABEL } from "@/config/studio/agreement";
import {
  studioBookingDetailsSchema,
  studioDetailsSchema,
  studioOfferingSchema,
  studioTimeSchema,
  STUDIO_STEP_META,
  type StudioBookingDraft,
} from "@/lib/studio/booking-schema";
import { finalizeStudioSignatureSchema } from "@/lib/studio/agreement-schema";
import { finalizeStudioSignature } from "@/lib/studio/agreement.functions";
import { releaseHold as releaseHoldFn } from "@/lib/availability.functions";
import {
  clearStudioDraft,
  loadStudioDraft,
  saveStudioDraft,
  touchStudioDraft,
  type StoredSigned,
} from "@/lib/studio/booking-draft";
import { isHoldActive } from "@/lib/hold";
import { getStripe } from "@/lib/stripe";
import { StepShell } from "@/components/booking/StepShell";
import { StepAgreement, CheckRow, type AgreementValues } from "@/components/booking/StepAgreement";
import { StepPayment } from "@/components/booking/StepPayment";
import { PaymentConfirmation } from "@/components/booking/PaymentConfirmation";
import { HoldTimer } from "@/components/booking/HoldTimer";
import { StepOffering, STUDIO_OFFERING_IMAGES } from "./StepOffering";
import { StepStudioTime } from "./StepTime";
import { StepStudioDetails } from "./StepDetails";
import { SessionGlance } from "./SessionGlance";

type Errors = Record<string, string | undefined>;

const COPY = [
  {
    title: "Book your session",
    supporting: "Portraits, headshots, passport photos, and class — pick what you need.",
  },
  {
    title: "Pick your time",
    supporting: "Only open times are shown. Pricing updates if you add extra time.",
  },
  {
    title: "Your details",
    supporting: "The essentials so we know who we're seeing.",
  },
  {
    title: "Review & sign",
    supporting: "You're one signature from booked. Read it through, then sign below.",
  },
  {
    title: "Secure your date",
    supporting: "",
  },
] as const;

const LAST_STEP = 5;
const SIGN_STEP = 4;
const INACTIVITY_MS = INACTIVITY_MINUTES * 60 * 1000;

export function StudioBookingFlow() {
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<StudioBookingDraft>({});
  const [agreement, setAgreement] = useState<AgreementValues>({});
  const [errors, setErrors] = useState<Errors>({});
  const [resumed, setResumed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState<StoredSigned | null>(null);
  const [paidBookingId, setPaidBookingId] = useState<string | null>(null);

  const sign = useServerFn(finalizeStudioSignature);
  const releaseUnsignedHold = useServerFn(releaseHoldFn);

  useEffect(() => {
    if (step >= SIGN_STEP) void getStripe();
  }, [step]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returning = params.get("booking");
    if (returning && params.get("paid")) {
      setPaidBookingId(returning);
      clearStudioDraft();
      setHydrated(true);
      return;
    }
    if (import.meta.env.DEV && (params.get("preview") === "booked" || params.get("preview") === "deposit")) {
      setPaidBookingId(params.get("preview") === "deposit" ? "preview-deposit" : "preview");
      setHydrated(true);
      return;
    }
    const draft = loadStudioDraft();
    if (draft) {
      const v = { ...draft.values };
      if (v.offering && !STUDIO_OFFERINGS[v.offering]) {
        delete v.offering;
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

  useEffect(() => {
    if (!hydrated) return;
    if (Object.keys(values).length === 0) return;
    saveStudioDraft(step, values, { signed });
  }, [hydrated, step, values, signed]);

  useEffect(() => {
    if (resumed) {
      toast("Welcome back — we saved your progress.");
      setResumed(false);
    }
  }, [resumed]);

  const startOver = useCallback(
    (reason: "idle" | "hold") => {
      const holdId = signed?.booking_id;
      clearStudioDraft();
      setStep(1);
      setValues({});
      setAgreement({});
      setErrors({});
      setSigned(null);
      setSubmitting(false);
      if (holdId) void releaseUnsignedHold({ data: { bookingId: holdId } });
      toast(
        reason === "idle"
          ? "Session ended after 10 minutes of inactivity. Start again when you're ready."
          : "Your 10-minute hold ended. The time is open again — start over to reserve it.",
      );
    },
    [releaseUnsignedHold, signed?.booking_id],
  );

  const startOverRef = useRef(startOver);
  startOverRef.current = startOver;
  const flowActiveRef = useRef(false);
  flowActiveRef.current = Boolean(paidBookingId) || step > 1 || Object.keys(values).length > 0 || Boolean(signed);

  useEffect(() => {
    if (!hydrated || paidBookingId) return;
    let lastActivity = Date.now();
    let lastTouch = 0;
    const bump = () => {
      lastActivity = Date.now();
      if (lastActivity - lastTouch < 15_000) return;
      lastTouch = lastActivity;
      touchStudioDraft();
    };
    const maybeReset = () => {
      if (!flowActiveRef.current) return;
      if (Date.now() - lastActivity < INACTIVITY_MS) return;
      startOverRef.current("idle");
      lastActivity = Date.now();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") maybeReset();
    };
    const events = ["pointerdown", "keydown", "touchstart", "scroll", "click"] as const;
    for (const event of events) {
      window.addEventListener(event, bump, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisible);
    const id = window.setInterval(maybeReset, 5_000);
    return () => {
      for (const event of events) window.removeEventListener(event, bump);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(id);
    };
  }, [hydrated, paidBookingId]);

  const patch = (p: StudioBookingDraft) => {
    setValues((v) => ({ ...v, ...p }));
    setErrors({});
    if (signed) setSigned(null);
  };

  const price = useMemo(() => {
    if (!values.offering) return null;
    const tier = STUDIO_OFFERINGS[values.offering];
    if (!tier) return null;
    return calculateStudioPrice({
      offering: values.offering,
      durationMinutes: values.durationMinutes ?? tier.baseMinutes,
    });
  }, [values.offering, values.durationMinutes]);

  const fullBooking = useMemo(() => {
    const result = studioBookingDetailsSchema.safeParse({
      ...values,
      eventLocation: values.eventLocation || STUDIO_LOCATION,
    });
    return result.success ? result.data : null;
  }, [values]);

  const renderedAgreement = useMemo(() => {
    if (!fullBooking) return null;
    return renderStudioAgreement({
      offering: fullBooking.offering,
      durationMinutes: fullBooking.durationMinutes,
      clientName: fullBooking.clientName,
      clientPhone: fullBooking.clientPhone,
      clientEmail: fullBooking.clientEmail,
      eventLocation: fullBooking.eventLocation,
      eventDate: fullBooking.eventDate,
      eventStartTime: fullBooking.eventStartTime,
      clientNotes: fullBooking.clientNotes,
      classSessionId: fullBooking.classSessionId,
    });
  }, [fullBooking]);

  const copy = COPY[Math.min(step, LAST_STEP) - 1]!;

  function collectIssues(issues: { path: PropertyKey[]; message: string }[]): Errors {
    const next: Errors = {};
    for (const issue of issues) {
      const key = String(issue.path[0] ?? "form");
      if (!next[key]) next[key] = issue.message;
    }
    return next;
  }

  async function submitSignature() {
    if (!fullBooking) {
      toast("Some details are missing — please step back and complete them.");
      return;
    }
    const parsed = finalizeStudioSignatureSchema.safeParse({
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
      saveStudioDraft(5, values, { signed: signedRecord });
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast("Agreement signed. Payment unlocks next.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast(
        message.includes("available") || message.includes("full")
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
      step === 1 ? studioOfferingSchema : step === 2 ? studioTimeSchema : studioDetailsSchema;

    const input =
      step === 1
        ? { offering: values.offering }
        : step === 2
          ? {
              eventDate: values.eventDate ?? "",
              eventStartTime: values.eventStartTime ?? "",
              durationMinutes:
                values.durationMinutes ??
                STUDIO_OFFERINGS[values.offering as StudioOfferingKey]?.baseMinutes ??
                90,
              ...(values.classSessionId ? { classSessionId: values.classSessionId } : {}),
            }
          : {
              clientName: values.clientName ?? "",
              clientPhone: values.clientPhone ?? "",
              clientEmail: values.clientEmail ?? "",
              clientNotes: values.clientNotes,
            };

    if (step === 3 && !agreement.detailsConfirmed) {
      toast("Please confirm your details are correct to continue.");
      return;
    }

    const result = schema.safeParse(input);
    if (!result.success) {
      setErrors(collectIssues(result.error.issues));
      if (step === 1) toast("Choose a session to continue.");
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
      <PaymentConfirmation
        bookingId={paidBookingId}
        preview={paidBookingId === "preview-deposit" ? "deposit" : paidBookingId === "preview"}
      />
    );
  }

  const canAdvance =
    step === 1
      ? Boolean(values.offering)
      : step === 2
        ? Boolean(values.eventDate && values.eventStartTime)
        : step === 3
          ? true
          : step === 4
            ? !submitting
            : step === 5
              ? false
              : true;

  const glanceProps = {
    offering: values.offering,
    eventDate: values.eventDate,
    eventStartTime: values.eventStartTime,
    durationMinutes: values.durationMinutes,
    ...(price ? { price } : {}),
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

  const offering = values.offering ? STUDIO_OFFERINGS[values.offering] : null;

  return (
    <StepShell
      step={step}
      title={copy.title}
      supporting={copy.supporting}
      stepLabels={STUDIO_STEP_META}
      {...(step > 1
        ? {
            onBack: () => {
              setErrors({});
              setStep(step - 1);
            },
          }
        : {})}
      {...(step > 1 ? { aside: <SessionGlance {...glanceProps} /> } : {})}
      footer={<SessionGlance {...glanceProps} compact />}
    >
      {step === 1 ? (
        <StepOffering
          {...(values.offering ? { value: values.offering } : {})}
          onChange={(next) =>
            patch({
              offering: next,
              durationMinutes: STUDIO_OFFERINGS[next].baseMinutes,
              eventDate: undefined,
              eventStartTime: undefined,
              classSessionId: undefined,
            })
          }
        />
      ) : null}

      {step === 2 && values.offering ? (
        <StepStudioTime
          offering={values.offering}
          values={values}
          errors={errors}
          onChange={patch}
          {...(signed?.booking_id ? { excludeBookingId: signed.booking_id } : {})}
        />
      ) : null}

      {step === 3 ? (
        <div className="space-y-6">
          <StepStudioDetails values={values} errors={errors} onChange={patch} />
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
        fullBooking && renderedAgreement ? (
          <StepAgreement
            values={agreement}
            errors={errors}
            rendered={renderedAgreement}
            consentLabel={STUDIO_CONSENT_LABEL}
            marketingPrompt={
              offering?.resource === "studio_acting"
                ? "May we mention this class in Studio 7 recaps and social channels? Declining does not affect your seat."
                : "May we feature images from your session in the Studio 7 portfolio and social channels? Declining does not affect your service."
            }
            onChange={(p) => {
              setAgreement((a) => ({ ...a, ...p }));
              setErrors({});
            }}
          />
        ) : (
          <p className="soft-card rounded-[24px] border border-border p-6 text-sm text-muted-foreground">
            Some details are still missing. Step back and complete them to see your agreement.
          </p>
        )
      ) : null}

      {step === 5 ? (
        signed ? (
          <div className="space-y-6">
            <div className="soft-inset flex items-start gap-3 rounded-[16px] border border-border p-5">
              <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                <HoldTimer signedAt={signed.signed_at} onExpired={() => startOver("hold")} />
              </p>
            </div>
            <StepPayment
              bookingId={signed.booking_id}
              {...(offering
                ? {
                    experienceName: offering.name,
                    imageUrl: STUDIO_OFFERING_IMAGES[offering.key].url,
                    depositEligible: offering.depositEligible,
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
