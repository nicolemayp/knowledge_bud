import webpush from "web-push";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT ?? "mailto:hello@knowledge-bud.app";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subj, pub, priv);
  configured = true;
  return true;
}

export type PushSub = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function sendPushTo(
  sub: PushSub,
  payload: { title: string; body: string; url?: string }
): Promise<{ ok: boolean; statusCode?: number; error?: string }> {
  if (!ensureConfigured()) return { ok: false, error: "VAPID keys not set" };
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (e) {
    const err = e as { statusCode?: number; message?: string };
    return {
      ok: false,
      statusCode: err.statusCode,
      error: err.message ?? "Push failed",
    };
  }
}
