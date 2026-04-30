"use client";

import { useEffect, useState } from "react";

export function EmailSubscribe() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/email/subscribe")
      .then((r) => r.json())
      .then((d) => {
        if (d.subscribed) {
          setSubscribed(true);
          setEmail(d.email ?? "");
        } else {
          setSubscribed(false);
        }
      })
      .catch(() => setSubscribed(false));
  }, []);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, monthlyDigest: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscribed(true);
        setMsg("✓ Subscribed!");
      } else {
        setErr(data.error ?? "Failed");
      }
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    if (!confirm("Unsubscribe from the monthly digest?")) return;
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/email/subscribe", { method: "DELETE" });
      if (res.ok) {
        setSubscribed(false);
        setEmail("");
      } else {
        setErr("Failed to unsubscribe");
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendTest() {
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`✓ Sent ${data.sent} papers to ${data.to}`);
      } else {
        setErr(data.error ?? "Send failed");
      }
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (subscribed === null) {
    return (
      <p className="text-sm text-ink-mute italic">Loading subscription…</p>
    );
  }

  return (
    <div className="space-y-3">
      {!subscribed ? (
        <>
          <p className="text-sm text-ink-soft">
            Get the monthly digest in your inbox on the 1st — same papers as
            the feed, with clinical implications.
          </p>
          <form onSubmit={subscribe} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-2xl bg-cream border-2 border-lavender-100 focus:border-lavender-300 outline-none px-4 py-2.5 text-sm font-medium placeholder:text-ink-mute"
            />
            <button
              type="submit"
              disabled={loading || !email}
              className="rounded-2xl bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white font-display font-bold text-sm px-5 disabled:opacity-50 transition-all"
            >
              {loading ? "…" : "Subscribe"}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-soft">
            ✉️ Subscribed as <span className="font-display font-bold text-ink">{email}</span>. You&rsquo;ll get the digest on the 1st of each month.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={sendTest}
              disabled={loading}
              className="rounded-2xl bg-gradient-to-r from-babyblue-400 to-lavender-400 hover:from-babyblue-500 hover:to-lavender-500 text-white font-display font-bold text-sm px-4 py-2 shadow-soft disabled:opacity-50"
            >
              {loading ? "Sending…" : "📨 Send a preview now"}
            </button>
            <button
              onClick={unsubscribe}
              disabled={loading}
              className="rounded-2xl bg-white border-2 border-pink-200 hover:border-pink-300 text-pink-600 font-display font-semibold text-sm px-4 py-2 transition-all"
            >
              Unsubscribe
            </button>
          </div>
        </>
      )}
      {msg && (
        <p className="text-sm font-display font-semibold text-pink-600">
          {msg}
        </p>
      )}
      {err && (
        <p className="text-sm font-display font-semibold text-red-500">
          ⚠ {err}
        </p>
      )}
      <p className="text-[10px] text-ink-mute leading-relaxed">
        Sent from <code>onboarding@resend.dev</code> via Resend free tier
        (3,000/mo, 100/day). Resend may only deliver to addresses associated
        with the account holder until a custom domain is verified.
      </p>
    </div>
  );
}
