"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function continueAsGuest() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/guest", { method: "POST" });
      if (!res.ok) throw new Error("Could not start guest session");
      router.push("/feed");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-10">
      <section className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <p className="text-center text-ink-soft text-base font-medium mb-10 px-4">
          Stay current on new mental health research — vetted, summarized, and
          delivered the first of every month. 🌷
        </p>

        <div className="rounded-3xl bg-white/70 backdrop-blur-sm border border-pink-100 shadow-soft p-6 space-y-3">
          <button
            onClick={continueAsGuest}
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-pink-400 via-lavender-400 to-babyblue-400 hover:from-pink-500 hover:to-babyblue-500 transition-all text-white font-display font-bold text-lg py-4 shadow-soft hover:shadow-pop active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
          >
            {loading ? "Setting up..." : "✨ Continue as Guest"}
          </button>

          {err && (
            <p className="text-sm text-pink-600 text-center font-semibold">{err}</p>
          )}

          <Link
            href="/signin"
            className="block w-full rounded-2xl bg-white border-2 border-lavender-200 hover:border-lavender-300 text-lavender-600 hover:text-lavender-700 font-display font-semibold text-base py-3 text-center transition-all"
          >
            Sign in with email
          </Link>

          <Link
            href="/signup"
            className="block w-full text-center text-sm font-semibold text-ink-mute hover:text-pink-500 py-2 transition-colors"
          >
            New here? Create an account →
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-ink-mute leading-relaxed px-4">
          Guest mode saves your topics & bookmarks securely in our cloud DB —
          tied to this browser. Sign up later to access them on any device.
        </p>
      </section>
    </main>
  );
}
