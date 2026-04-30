"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/request-magic", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) setSent(true);
      else setErr(data.error ?? "Could not send link");
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-10">
      <section className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-pink-100 shadow-soft p-6">
          {sent ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-3">📨</p>
              <h1 className="font-display text-xl font-bold text-ink mb-2">
                Check your inbox
              </h1>
              <p className="text-sm text-ink-soft mb-4 leading-relaxed">
                We sent a one-time sign-in link to{" "}
                <span className="font-display font-bold text-ink">{email}</span>.
                Tap it to sign in. Link works for 15 minutes.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="text-sm font-display font-semibold text-lavender-600 hover:text-lavender-700"
              >
                ← Use a different email
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-xl font-bold text-ink mb-1">
                Sign in
              </h1>
              <p className="text-sm text-ink-soft mb-5">
                We&rsquo;ll send you a one-time link — no password needed.
              </p>
              <form onSubmit={submit} className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl bg-cream border-2 border-lavender-100 focus:border-lavender-300 outline-none px-4 py-3 text-sm font-medium placeholder:text-ink-mute"
                />
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full rounded-2xl bg-gradient-to-r from-pink-400 via-lavender-400 to-babyblue-400 hover:from-pink-500 hover:to-babyblue-500 transition-all text-white font-display font-bold text-base py-3 shadow-soft disabled:opacity-50"
                >
                  {loading ? "Sending…" : "✨ Email me a sign-in link"}
                </button>
                {err && (
                  <p className="text-sm text-pink-600 font-semibold text-center">
                    {err}
                  </p>
                )}
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-ink-mute">
          <Link href="/" className="hover:text-pink-500">
            ← Continue as guest instead
          </Link>
        </p>
      </section>
    </main>
  );
}
