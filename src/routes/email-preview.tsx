import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { allBookingEmailPreviews } from "@/lib/email/booking-emails";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/email-preview")({
  head: () => ({
    meta: [{ title: "Booking emails — Studio 7 Miami" }],
  }),
  component: EmailPreview,
});

function EmailPreview() {
  const emails = allBookingEmailPreviews();
  const [active, setActive] = useState("photobooth-balance-due");
  const current = emails.find((email) => email.id === active) ?? emails[0]!;

  return (
    <div className="min-h-svh bg-[#e8e8e4]">
      <header className="border-b border-black/5 bg-[#f6f6f4] px-4 py-4 sm:px-6">
        <p className="label-caps text-[10px] text-muted-foreground">Email preview</p>
        <h1 className="mt-1 font-display text-2xl tracking-tight">Booking emails</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Same layout as the proposal emails: black header, Manrope, glance card, pill footer. Stripe
          still sends its own receipt separately. Remaining-balance reminders go out 7 days before,
          3 days before, and on the due date — the button opens that booking's pay screen.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {emails.map((email) => (
            <button
              key={email.id}
              type="button"
              onClick={() => setActive(email.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-left text-[11px] transition-colors",
                email.id === current.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background hover:border-foreground/40",
              )}
            >
              {email.note}
            </button>
          ))}
        </div>
      </header>

      <div className="overflow-x-auto px-4 py-6 sm:px-6">
        <div className="flex min-w-max gap-4">
          <Frame label="Desktop Gmail · 680px" subject={current.subject} width={680} height={860}>
            {current.html}
          </Frame>
          <Frame label="Mobile Gmail · 390px" subject={current.subject} width={390} height={760}>
            {current.html}
          </Frame>
        </div>
      </div>
    </div>
  );
}

function Frame({
  label,
  subject,
  width,
  height,
  children,
}: {
  label: string;
  subject: string;
  width: number;
  height: number;
  children: string;
}) {
  return (
    <section
      className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(17,17,17,0.08)]"
      style={{ width }}
    >
      <div className="border-b border-black/[0.06] bg-[#f6f6f4] px-3.5 py-3 text-xs leading-snug text-[#5f6368]">
        {label}
        <br />
        <strong className="font-semibold text-foreground">From</strong> Studio 7 Miami
        <br />
        <strong className="font-semibold text-foreground">Subject</strong> {subject}
      </div>
      <iframe title={label} srcDoc={children} className="block w-full border-0 bg-[#F7F7F5]" style={{ height }} />
    </section>
  );
}
