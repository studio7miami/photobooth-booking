import { useMemo } from "react";
import { Check } from "lucide-react";

import { CONSENT_LABEL, renderAgreement, type AgreementVars, type RenderedAgreement } from "@/config/agreement";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FieldError } from "./StepShell";
import { SignaturePad } from "./SignaturePad";

export type AgreementValues = {
  signerName?: string | undefined;
  signatureValue?: string | null | undefined;
  consent?: boolean | undefined;
  detailsConfirmed?: boolean | undefined;
  marketingOptIn?: boolean | undefined;
};

export function StepAgreement({
  booking,
  values,
  errors,
  onChange,
  onEditDetails,
  rendered,
  consentLabel,
  marketingPrompt,
  showMarketing = true,
}: {
  booking?: AgreementVars | undefined;
  values: AgreementValues;
  errors: Record<string, string | undefined>;
  onChange: (patch: AgreementValues) => void;
  onEditDetails?: (() => void) | undefined;
  rendered?: RenderedAgreement | undefined;
  consentLabel?: string | undefined;
  marketingPrompt?: string | undefined;
  showMarketing?: boolean | undefined;
}) {
  const agreement = useMemo(() => {
    if (rendered) return rendered;
    if (!booking) {
      return { version: "", title: "", summary: [], sections: [], text: "" } satisfies RenderedAgreement;
    }
    return renderAgreement(booking);
  }, [booking, rendered]);
  void onEditDetails;

  return (
    <div className="space-y-4">
      <section className="soft-card rounded-[24px] border border-border p-5 sm:p-8">
        <p className="label-caps text-[10px] text-muted-foreground">Service agreement</p>

        <div className="soft-inset mt-4 max-h-[18rem] overflow-y-auto rounded-[16px] border border-border bg-card p-5 sm:mt-6 sm:max-h-[26rem] sm:p-6">
          <div className="space-y-6">
            {agreement.sections.map((section) => (
              <div key={section.heading}>
                <h3 className="label-caps text-[10px]">{section.heading}</h3>
                <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {section.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="soft-card space-y-6 rounded-[24px] border border-border p-5 sm:p-8">
        <div>
          <Label htmlFor="signerName" className="label-caps text-[10px] text-muted-foreground">
            Full legal name
          </Label>
          <Input
            id="signerName"
            value={values.signerName ?? ""}
            onChange={(e) => onChange({ signerName: e.target.value })}
            placeholder="Jordan Rivera"
            autoComplete="name"
            className="mt-2 h-12 rounded-[14px]"
          />
          <FieldError message={errors["signerName"]} />
        </div>

        <div>
          <SignaturePad onChange={(signatureValue) => onChange({ signatureValue })} />
          <FieldError message={errors["signatureValue"]} />
        </div>

        <div>
          <CheckRow
            checked={Boolean(values.consent)}
            onToggle={() => onChange({ consent: !values.consent })}
            label={consentLabel ?? CONSENT_LABEL}
            required
          />
          <FieldError message={errors["consent"]} />
        </div>

        {showMarketing ? (
          <div>
            <p className="label-caps text-[10px] text-muted-foreground">Marketing permission</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {marketingPrompt ??
                "May we feature selected images or mentions in the Studio 7 portfolio and social channels? Declining does not affect your service."}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                { value: true, label: "Yes" },
                { value: false, label: "No" },
              ].map((opt) => {
                const active = values.marketingOptIn === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => onChange({ marketingOptIn: opt.value })}
                    className={cn(
                      "label-caps flex h-12 items-center justify-center gap-2 rounded-[14px] border text-[10px] transition-all",
                      active
                        ? "soft-inset border-foreground bg-secondary/70 text-foreground"
                        : "soft-card border-border text-muted-foreground hover:text-foreground",
                    )}
                    aria-pressed={active}
                  >
                    {active ? <Check className="size-3.5" aria-hidden="true" /> : null}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function CheckRow({
  checked,
  onToggle,
  label,
  required,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  required?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "flex w-full items-start gap-3 rounded-[16px] border p-4 text-left transition-all",
        checked ? "soft-inset border-foreground bg-secondary/70" : "soft-card border-border",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[6px] border",
          checked ? "border-foreground bg-foreground" : "border-border bg-card",
        )}
      >
        {checked ? <Check className="size-3.5 text-background" aria-hidden="true" /> : null}
      </span>
      <span className="text-sm">
        {label}
        {required ? <span className="text-muted-foreground"> (required)</span> : null}
      </span>
    </button>
  );
}
