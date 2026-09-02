/** Visual system shared with Studio 7 proposal emails. */

export const EMAIL_LOGO_URL =
  "https://framerusercontent.com/assets/3HwVggLmyKfOrpHHCI76j8tFoTY.png";
export const EMAIL_FONT = "Manrope, Helvetica, Arial, sans-serif";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type EmailSpec = { label: string; value: string; html?: boolean };

export function specRowHtml(spec: EmailSpec, last: boolean) {
  const border = last ? "none" : "1px solid rgba(17,17,17,0.08)";
  const value = spec.html ? spec.value : escapeHtml(spec.value);
  const valueWrap = spec.html ? "" : "white-space:nowrap;";
  return `<tr><td class="s7-email-spec-label" style="padding:13px 0;border-bottom:${border};font-family:${EMAIL_FONT};font-size:10px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#6F6F6B;vertical-align:middle;white-space:nowrap;">${escapeHtml(spec.label)}</td><td class="s7-email-spec-value" style="padding:13px 0 13px 16px;border-bottom:${border};font-family:${EMAIL_FONT};font-size:14px;color:#111;text-align:right;line-height:1.45;${valueWrap}">${value}</td></tr>`;
}

export const STUDIO_ADDRESS_HTML =
  '<span style="display:block">638 NW 62nd St</span><span style="display:block">Miami, FL 33150</span>';

export function studioFooterHtml() {
  return `<p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:#6F6F6B;">Studio 7 Miami<br>638 NW 62nd St<br>Miami, FL 33150</p>
<p style="margin:0;font-size:12px;line-height:1.6;"><a href="https://studio7.miami" style="color:#111;text-decoration:none;">studio7.miami</a><span style="color:#C8C8C4;"> · </span><a href="https://book.studio7.miami" style="color:#111;text-decoration:none;">book.studio7.miami</a></p>`;
}

export function renderStudioEmail(args: {
  subject: string;
  preheader: string;
  kicker: string;
  headline: string;
  intro: string;
  cardLabel: string;
  specs: EmailSpec[];
  cta?: { href: string; label: string };
}) {
  const specs = args.specs.filter((row) => row.value);
  const specHtml = specs
    .map((row, index) => specRowHtml(row, index === specs.length - 1))
    .join("");
  const cta = args.cta
    ? `<tr><td style="padding:20px 28px 8px;" align="center"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#111111" style="background:#111;border-radius:999px;">
<a href="${escapeHtml(args.cta.href)}" style="display:inline-block;padding:14px 28px;font-size:11px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;color:#F7F7F5;">${escapeHtml(args.cta.label)}</a>
</td></tr></table></td></tr>`
    : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<meta name="x-apple-disable-message-reformatting">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&display=swap" rel="stylesheet">
<title>${escapeHtml(args.subject)}</title>
<style>
  .s7-email-title {
    margin: 0 0 10px;
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.15;
    color: #111;
    white-space: nowrap;
  }
  .s7-email-intro {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: #6F6F6B;
  }
  .s7-email-pad {
    padding: 36px 28px 12px;
  }
  @media only screen and (max-width: 600px) {
    .s7-email-title {
      font-size: 15px !important;
      letter-spacing: -0.04em !important;
      white-space: nowrap !important;
    }
    .s7-email-intro {
      font-size: 12px !important;
      line-height: 1.4 !important;
    }
    .s7-email-spec-label {
      font-size: 8px !important;
      letter-spacing: 0.08em !important;
      padding-top: 10px !important;
      padding-bottom: 10px !important;
      white-space: nowrap !important;
    }
    .s7-email-spec-value {
      font-size: 11px !important;
      padding-top: 10px !important;
      padding-bottom: 10px !important;
      padding-left: 8px !important;
      white-space: nowrap !important;
    }
    .s7-email-pad {
      padding: 22px 14px 8px !important;
    }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#F7F7F5;font-family:${EMAIL_FONT};color:#111;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(args.preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F7F7F5;"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background:#F7F7F5;">
<tr><td bgcolor="#000000" style="background:#000;padding:0;text-align:center;line-height:0;"><img src="${EMAIL_LOGO_URL}" width="600" alt="Studio 7 Miami" style="display:block;width:100%;max-width:600px;height:auto;border:0;background:#000;"></td></tr>
<tr><td class="s7-email-pad" style="padding:36px 28px 12px;"><p style="margin:0 0 8px;font-size:10px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:#6F6F6B;">${escapeHtml(args.kicker)}</p>
<h1 class="s7-email-title" style="margin:0 0 10px;font-size:28px;font-weight:600;letter-spacing:-.02em;line-height:1.15;color:#111;white-space:nowrap;">${escapeHtml(args.headline)}</h1>
<p class="s7-email-intro" style="margin:0;font-size:15px;line-height:1.6;color:#6F6F6B;">${escapeHtml(args.intro)}</p></td></tr>
<tr><td style="padding:20px 28px 8px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FCFCFA;border:1px solid rgba(17,17,17,.08);border-radius:24px;">
<tr><td style="padding:22px 24px 8px;"><p style="margin:0;font-size:10px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:#6F6F6B;">${escapeHtml(args.cardLabel)}</p></td></tr>
<tr><td style="padding:0 24px 8px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${specHtml}</table></td></tr></table></td></tr>
${cta}
<tr><td style="padding:28px 28px 40px;text-align:center;">${studioFooterHtml()}
</td></tr></table></td></tr></table></body></html>`;
}
