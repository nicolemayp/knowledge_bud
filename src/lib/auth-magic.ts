import { randomBytes } from "node:crypto";
import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Knowledge Bud <onboarding@resend.dev>";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (_resend) return _resend;
  _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export function makeToken(): string {
  return randomBytes(32).toString("hex");
}

export async function sendMagicLink(args: {
  to: string;
  link: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "Resend not configured" };
  try {
    await resend.emails.send({
      from: FROM,
      to: args.to,
      subject: "🌸 Your Knowledge Bud sign-in link",
      html: `<!doctype html><html><body style="margin:0;padding:0;background:#FFFBFD;font-family:Nunito,Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(180deg,#FFEAF5 0%,#EFE5FF 50%,#DEEEFF 100%);padding:40px 16px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0" width="500" style="max-width:500px;">
        <tr><td style="text-align:center;padding-bottom:20px;">
          <div style="font-family:Quicksand,Arial,sans-serif;font-size:30px;font-weight:700;color:#F47BAB;">🌸 Knowledge Bud</div>
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #FFD0E5;border-radius:18px;padding:28px;text-align:center;">
          <p style="font-family:Quicksand,Arial,sans-serif;font-size:18px;font-weight:700;color:#2D2640;margin:0 0 8px;">Tap below to sign in</p>
          <p style="font-size:13px;color:#5A4F75;margin:0 0 20px;">This link works for 15 minutes and only once.</p>
          <a href="${args.link}" style="display:inline-block;background:linear-gradient(90deg,#F999C0 0%,#B588F0 100%);color:#ffffff;font-family:Quicksand,Arial,sans-serif;font-weight:700;font-size:15px;text-decoration:none;padding:12px 28px;border-radius:999px;">Sign in to Knowledge Bud →</a>
          <p style="font-size:11px;color:#8B82A6;margin-top:24px;">If you didn't request this, ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      text: `Knowledge Bud sign-in link:\n\n${args.link}\n\nThis link works for 15 minutes and only once. If you didn't request this, ignore this email.`,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" };
  }
}

export const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
