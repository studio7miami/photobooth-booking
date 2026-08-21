import { formatPhoneInput } from "@/lib/format-display";
import { STUDIO_LOCATION } from "@/config/studio/booking-rules";
import { FieldError } from "@/components/booking/StepShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type StudioDetailValues = {
  clientName?: string | undefined;
  clientPhone?: string | undefined;
  clientEmail?: string | undefined;
  clientNotes?: string | undefined;
};

const FIELDS = [
  { key: "clientName", label: "Full name", type: "text", autoComplete: "name", placeholder: "Jordan Rivera" },
  { key: "clientPhone", label: "Phone", type: "tel", autoComplete: "tel", placeholder: "(305) 555-0142" },
  { key: "clientEmail", label: "Email", type: "email", autoComplete: "email", placeholder: "you@email.com" },
] as const;

export function StepStudioDetails({
  values,
  errors,
  onChange,
}: {
  values: StudioDetailValues;
  errors: Record<string, string | undefined>;
  onChange: (patch: StudioDetailValues) => void;
}) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {FIELDS.map((f) => (
        <div key={f.key} className="rounded-[24px] border border-border soft-card p-5 sm:p-6">
          <Label htmlFor={f.key} className="label-caps text-[10px] text-muted-foreground">
            {f.label}
          </Label>
          <Input
            id={f.key}
            type={f.type}
            autoComplete={f.autoComplete}
            placeholder={f.placeholder}
            maxLength={f.key === "clientPhone" ? 14 : 255}
            value={
              f.key === "clientPhone"
                ? formatPhoneInput(values[f.key] ?? "")
                : (values[f.key] ?? "")
            }
            onChange={(e) =>
              onChange({
                [f.key]:
                  f.key === "clientPhone" ? formatPhoneInput(e.target.value) : e.target.value,
              })
            }
            className="soft-inset mt-2 h-14 rounded-[16px] border-border bg-background text-base"
          />
          <FieldError message={errors[f.key]} />
        </div>
      ))}

      <div className="rounded-[24px] border border-border soft-card p-5 sm:p-6">
        <p className="label-caps text-[10px] text-muted-foreground">Location</p>
        <p className="mt-2 text-base">{STUDIO_LOCATION}</p>
        <p className="mt-1 text-xs text-muted-foreground">All studio sessions are here.</p>
      </div>

      <div className="rounded-[24px] border border-border soft-card p-5 sm:p-6">
        <Label htmlFor="clientNotes" className="label-caps text-[10px] text-muted-foreground">
          Notes (optional)
        </Label>
        <Textarea
          id="clientNotes"
          placeholder="Anything we should know — looks, usage, accessibility…"
          maxLength={500}
          value={values.clientNotes ?? ""}
          onChange={(e) => onChange({ clientNotes: e.target.value })}
          className="soft-inset mt-2 min-h-24 rounded-[16px] border-border bg-background text-base"
        />
        <FieldError message={errors["clientNotes"]} />
      </div>
    </div>
  );
}
