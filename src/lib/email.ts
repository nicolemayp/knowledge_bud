/**
 * Email digest via Resend.
 * Free tier: 3,000/mo, 100/day. Plenty for an early audience.
 *
 * Sender: defaults to `Knowledge Bud <onboarding@resend.dev>`.
 * In production with a verified domain, swap EMAIL_FROM in env.
 */

import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (_resend) return _resend;
  _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export type DigestPaper = {
  title: string;
  bluf: string | null;
  clinicalImplications: string | null;
  source: string;
  journal?: string | null;
  year?: number | null;
  evidence?: string | null;
  url: string;
  topics?: string[];
};

const FROM = process.env.EMAIL_FROM ?? "Knowledge Bud <onboarding@resend.dev>";

export async function sendDigest(args: {
  to: string;
  papers: DigestPaper[];
  isTest?: boolean;
  unsubscribeUrl?: string;
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "RESEND_API_KEY not set" };
  if (args.papers.length === 0)
    return { ok: false, error: "No papers to send" };

  const month = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const subject = args.isTest
    ? `🌸 Knowledge Bud — preview digest`
    : `🌸 Knowledge Bud — ${month}: ${args.papers.length} new papers`;

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: args.to,
      subject,
      html: renderHtml(args),
      text: renderText(args),
    });
    return { ok: true, id: result.data?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" };
  }
}

// ─── HTML TEMPLATE ─────────────────────────────────────────────────
function renderHtml(args: {
  papers: DigestPaper[];
  isTest?: boolean;
  unsubscribeUrl?: string;
}): string {
  const month = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const paperBlocks = args.papers
    .map(
      (p) => `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border:1px solid #FFD0E5;border-radius:18px;margin:12px 0;">
        <tr><td style="padding:18px 20px;">
          <div style="font-size:11px;font-weight:700;color:#A36CE6;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
            ${escapeHtml(p.source)}${p.evidence && p.evidence !== "unknown" ? ` · ${escapeHtml(p.evidence)}` : ""}${p.year ? ` · ${p.year}` : ""}
          </div>
          <div style="font-size:17px;font-weight:700;color:#2D2640;line-height:1.4;margin-bottom:6px;font-family:Quicksand,Arial,sans-serif;">
            ${escapeHtml(p.bluf ?? p.title)}
          </div>
          <div style="font-size:13px;color:#5A4F75;margin-bottom:10px;">
            ${escapeHtml(p.title)}${p.journal ? ` · <em>${escapeHtml(p.journal)}</em>` : ""}
          </div>
          ${
            p.clinicalImplications
              ? `
          <div style="background:linear-gradient(135deg,#FFEAF5 0%,#EFE5FF 100%);border:1px solid #FFD0E5;border-radius:12px;padding:12px 14px;margin:8px 0;">
            <div style="font-size:10px;font-weight:700;color:#E45F95;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">
              💡 Implications for clinical practice
            </div>
            <div style="font-size:13px;color:#2D2640;line-height:1.5;">
              ${escapeHtml(p.clinicalImplications)}
            </div>
          </div>`
              : ""
          }
          <div style="margin-top:10px;">
            <a href="${escapeAttr(p.url)}" style="display:inline-block;background:linear-gradient(90deg,#F999C0 0%,#B588F0 100%);color:#ffffff;font-weight:700;font-size:13px;text-decoration:none;padding:8px 16px;border-radius:999px;font-family:Quicksand,Arial,sans-serif;">
              Read source →
            </a>
          </div>
        </td></tr>
      </table>`
    )
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFFBFD;font-family:Nunito,Arial,sans-serif;color:#2D2640;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(180deg,#FFEAF5 0%,#EFE5FF 50%,#DEEEFF 100%);padding:32px 16px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;">
        <tr><td style="text-align:center;padding-bottom:20px;">
          <div style="font-family:Quicksand,Arial,sans-serif;font-size:32px;font-weight:700;background:linear-gradient(90deg,#F47BAB,#A36CE6,#5BA8F0);-webkit-background-clip:text;background-clip:text;color:#F47BAB;">
            🌸 Knowledge Bud
          </div>
          <div style="font-size:13px;color:#5A4F75;margin-top:4px;">
            ${args.isTest ? "Preview digest" : `${escapeHtml(month)} digest`} — ${args.papers.length} new paper${args.papers.length === 1 ? "" : "s"} for clinical practice
          </div>
        </td></tr>
        ${paperBlocks}
        <tr><td style="text-align:center;padding:28px 16px 12px;font-size:11px;color:#8B82A6;line-height:1.6;">
          You&rsquo;re subscribed to Knowledge Bud&rsquo;s monthly digest.<br>
          AI-generated summaries are clearly labeled — verify with the original source for clinical decisions.<br>
          ${args.unsubscribeUrl ? `<a href="${escapeAttr(args.unsubscribeUrl)}" style="color:#8B82A6;">Unsubscribe</a> · ` : ""}<a href="https://knowledge-bud.vercel.app" style="color:#8B82A6;">Open the app</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ─── PLAIN TEXT FALLBACK ───────────────────────────────────────────
function renderText(args: { papers: DigestPaper[]; isTest?: boolean }): string {
  const lines: string[] = [];
  lines.push("🌸 Knowledge Bud");
  lines.push(args.isTest ? "Preview digest" : `${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })} digest`);
  lines.push(`${args.papers.length} new papers for clinical practice`);
  lines.push("");
  args.papers.forEach((p, i) => {
    lines.push(`${i + 1}. ${p.bluf ?? p.title}`);
    if (p.title !== (p.bluf ?? p.title)) lines.push(`   ${p.title}`);
    if (p.clinicalImplications) {
      lines.push(`   💡 ${p.clinicalImplications}`);
    }
    lines.push(`   Source: ${p.source}${p.journal ? ` · ${p.journal}` : ""}`);
    lines.push(`   Read: ${p.url}`);
    lines.push("");
  });
  lines.push("---");
  lines.push("AI summaries are labeled. Verify with original sources for clinical decisions.");
  lines.push("Open the app: https://knowledge-bud.vercel.app");
  return lines.join("\n");
}

// ─── HELPERS ───────────────────────────────────────────────────────
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}
