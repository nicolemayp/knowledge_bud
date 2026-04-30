"use client";

import { useEffect, useState } from "react";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type State = "idle" | "checking" | "subscribed" | "unsubscribed" | "denied" | "unsupported";

export function PushSubscribe() {
  const [state, setState] = useState<State>("checking");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "subscribed" : "unsubscribed"))
      .catch(() => setState("unsubscribed"));
  }, []);

  async function subscribe() {
    setBusy(true);
    setMsg(null);
    try {
      if (!PUBLIC_KEY) {
        setMsg("Push isn't configured (VAPID public key missing).");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        setMsg("Notifications blocked in browser settings.");
        return;
      }
      const keyArray = urlBase64ToUint8Array(PUBLIC_KEY);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyArray.buffer.slice(
          keyArray.byteOffset,
          keyArray.byteOffset + keyArray.byteLength
        ) as ArrayBuffer,
      });
      const data = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint: data.endpoint,
          keys: data.keys,
        }),
      });
      if (!res.ok) throw new Error("Server save failed");
      setState("subscribed");
      setMsg("✓ Subscribed.");
    } catch (e) {
      setMsg(e instanceof Error ? `Error: ${e.message}` : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("unsubscribed");
      setMsg("Unsubscribed.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json();
      if (res.ok) setMsg(`✓ Sent ${data.sent}/${data.total} notifications.`);
      else setMsg(`Error: ${data.error}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">
        Get a push notification when new research lands matching your topics.
        Free, in-browser, opt-in. iOS needs you to install the PWA first
        (tap the Share icon → Add to Home Screen).
      </p>
      {state === "unsupported" && (
        <p className="text-sm text-ink-mute italic">
          This browser doesn&rsquo;t support push notifications.
        </p>
      )}
      {state === "denied" && (
        <p className="text-sm text-pink-600 font-semibold">
          Notifications are blocked in your browser settings — re-enable to
          subscribe.
        </p>
      )}
      {state === "unsubscribed" && (
        <button
          onClick={subscribe}
          disabled={busy}
          className="rounded-2xl bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white font-display font-bold text-sm px-5 py-2.5 shadow-soft disabled:opacity-50"
        >
          {busy ? "…" : "🔔 Enable push"}
        </button>
      )}
      {state === "subscribed" && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={sendTest}
            disabled={busy}
            className="rounded-2xl bg-gradient-to-r from-babyblue-400 to-lavender-400 text-white font-display font-bold text-sm px-4 py-2 shadow-soft disabled:opacity-50"
          >
            {busy ? "…" : "📨 Send test"}
          </button>
          <button
            onClick={unsubscribe}
            disabled={busy}
            className="rounded-2xl bg-white border-2 border-pink-200 hover:border-pink-300 text-pink-600 font-display font-semibold text-sm px-4 py-2 transition-all"
          >
            Disable
          </button>
        </div>
      )}
      {msg && (
        <p className="text-sm font-display font-semibold text-pink-600">{msg}</p>
      )}
    </div>
  );
}
