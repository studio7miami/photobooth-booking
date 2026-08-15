import { EVENT_TYPES } from "@/config/pricing";
import { formatPhoneInput } from "@/lib/format-display";
import { AddressField } from "./AddressField";
import { FieldError } from "./StepShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type DetailValues = {
  clientName?: string | undefined;
  clientPhone?: string | undefined;
  clientEmail?: string | undefined;
  eventLocation?: string | undefined;
  eventType?: string | undefined;
  eventTypeOther?: string | undefined;
};

const FIELDS = [
  { key: "clientName", label: "Full name", type: "text", autoComplete: "name", placeholder: "Jordan Rivera" },
  { key: "clientPhone", label: "Phone", type: "tel", autoComplete: "tel", placeholder: "(305) 555-0142" },
  { key: "clientEmail", label: "Email", type: "email", autoComplete: "email", placeholder: "you@email.com" },
] as const;

export function StepDetails({
  values,
  errors,
  onChange,
  onAddressLoadingChange,
}: {
  values: DetailValues;
  errors: Record<string, string | undefined>;
  onChange: (patch: DetailValues) => void;
  onAddressLoadingChange?: (loading: boolean) => void;
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
        <Label htmlFor="eventLocation" className="label-caps text-[10px] text-muted-foreground">
          Event location
        </Label>
        <AddressField
          id="eventLocation"
          value={values.eventLocation ?? ""}
          onChange={(v) => onChange({ eventLocation: v })}
          onLoadingChange={onAddressLoadingChange}
        />
        <FieldError message={errors["eventLocation"]} />
      </div>

      <div className="rounded-[24px] border border-border soft-card p-5 sm:p-6">
        <p className="label-caps text-[10px] text-muted-foreground">Event type</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {EVENT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={values.eventType === t.value}
              onClick={() => onChange({ eventType: t.value })}
              className={cn(
                "label-caps rounded-full border px-5 py-3 text-[11px] transition-all",
                values.eventType === t.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background hover:border-foreground/40",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {values.eventType === "other" ? (
          <div className="mt-4">
            <Label htmlFor="eventTypeOther" className="label-caps text-[10px] text-muted-foreground">
              Tell us more
            </Label>
            <Input
              id="eventTypeOther"
              type="text"
              placeholder="Reunion, launch party, film shoot…"
              maxLength={120}
              value={values.eventTypeOther ?? ""}
              onChange={(e) => onChange({ eventTypeOther: e.target.value })}
              className="soft-inset mt-2 h-14 rounded-[16px] border-border bg-background text-base"
            />
            <FieldError message={errors["eventTypeOther"]} />
          </div>
        ) : null}
        <FieldError message={errors["eventType"]} />
      </div>
    </div>
  );
}
