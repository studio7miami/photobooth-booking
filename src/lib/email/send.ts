export async function sendHtmlEmail(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const key = process.env["RESEND_API_KEY"]?.trim();
  const from =
    process.env["EMAIL_FROM"]?.trim() || process.env["INVITE_FROM_EMAIL"]?.trim();
  if (!key || !from) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY + EMAIL_FROM)." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return { ok: false, error: detail.slice(0, 400) || `Resend ${response.status}` };
  }
  return { ok: true };
}
