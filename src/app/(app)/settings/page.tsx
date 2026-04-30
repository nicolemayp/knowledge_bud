"use client";

import { useEffect, useState } from "react";
import { SOURCES, formatLimit } from "@/lib/sources";
import Link from "next/link";

type SourceState = {
  slug: string;
  requestsToday: number;
  requestsThisMonth: number;
  lastRefreshAt: string | null;
};

const FRIENDLY_TIME = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return d.toLocaleDateString();
};

export default function SettingsPage() {
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [states, setStates] = useState<Record<string, SourceState>>({});

  async function loadStates() {
    try {
      const res = await fetch("/api/sources-state");
      const data = await res.json();
      const map: Record<string, SourceState> = {};
      (data.states ?? []).forEach((s: SourceState) => {
        map[s.slug] = s;
      });
      setStates(map);
    } catch {}
  }

  useEffect(() => {
    loadStates();
  }, []);

  async function refresh(slug: string) {
    setRefreshing(slug);
    setResults({ ...results, [slug]: "" });
    try {
      const res = await fetch(`/api/sources/${slug}/refresh`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        const ai = data.aiUsed ? ` (${data.summarised} AI summaries)` : "";
        setResults({
          ...results,
          [slug]: `✓ ${data.added ?? 0} new papers${ai}`,
        });
        loadStates();
      } else {
        setResults({
          ...results,
          [slug]: `✗ ${data.error ?? "Failed"}`,
        });
      }
    } catch {
      setResults({ ...results, [slug]: "✗ Network error" });
    } finally {
      setRefreshing(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink">⚙️ Settings</h1>
        <p className="text-sm text-ink-soft">
          Manage sources, account, and preferences.
        </p>
      </header>

      <section className="rounded-3xl bg-white/85 border border-pink-100 shadow-soft p-5">
        <h2 className="font-display font-bold text-lg mb-2">Account</h2>
        <p className="text-sm text-ink-soft mb-3">
          You&rsquo;re using Knowledge Bud as a guest. Your data is saved in
          our Neon cloud DB, tied to this browser via a private cookie.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href="/signup"
            className="rounded-2xl bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white font-display font-bold text-sm px-4 py-2 shadow-soft"
          >
            Create an account
          </a>
          <a
            href="/api/logout"
            className="rounded-2xl bg-white border-2 border-lavender-200 hover:border-lavender-300 text-lavender-600 font-display font-semibold text-sm px-4 py-2 transition-all"
          >
            Sign out
          </a>
        </div>
      </section>

      <section className="rounded-3xl bg-gradient-to-br from-pink-100 via-lavender-100 to-babyblue-100 border border-pink-200 shadow-soft p-5">
        <h2 className="font-display font-bold text-lg mb-2">🎙️ Listen & subscribe</h2>
        <p className="text-sm text-ink-soft mb-3">
          The monthly podcast, email digest, and push notifications all
          live in their own tab now — easier to find.
        </p>
        <Link
          href="/listen"
          className="inline-block rounded-2xl bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white font-display font-bold text-sm px-4 py-2 shadow-soft"
        >
          Open Listen tab →
        </Link>
      </section>

      <section className="rounded-3xl bg-white/85 border border-pink-100 shadow-soft p-5">
        <h2 className="font-display font-bold text-lg mb-1">Sources</h2>
        <p className="text-sm text-ink-soft mb-4">
          All free, all vetted. Each has its own API budget — manual refreshes
          are rate-limited to protect the shared limit.
        </p>

        <ul className="space-y-3">
          {SOURCES.map((s) => {
            const state = states[s.slug];
            return (
              <li
                key={s.slug}
                className="rounded-2xl bg-cream border border-pink-100 p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-ink">
                      {s.name}{" "}
                      <span className="text-[10px] uppercase tracking-wider font-bold text-lavender-500 ml-1">
                        {s.reliability}
                      </span>
                    </h3>
                    <p className="text-xs text-ink-soft leading-snug">
                      {s.description}
                    </p>
                  </div>
                  <button
                    onClick={() => refresh(s.slug)}
                    disabled={refreshing === s.slug}
                    className="shrink-0 rounded-full bg-gradient-to-r from-pink-100 to-lavender-100 hover:from-pink-200 hover:to-lavender-200 text-pink-600 font-display font-semibold text-xs border border-pink-200 px-3 py-1.5 disabled:opacity-50 transition-all"
                  >
                    {refreshing === s.slug ? "⏳ Pulling…" : "🔄 Refresh"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-1">
                  {s.limits.map((l, i) => (
                    <span
                      key={i}
                      className="chip bg-babyblue-50 text-babyblue-600 border border-babyblue-200 text-[10px]"
                    >
                      {formatLimit(l)}
                    </span>
                  ))}
                </div>

                <p className="text-[10px] text-ink-mute font-mono">
                  Used this month: {state?.requestsThisMonth ?? 0} · Last
                  refresh: {FRIENDLY_TIME(state?.lastRefreshAt ?? null)}
                </p>
                {results[s.slug] && (
                  <p className="text-xs font-display font-semibold text-pink-600 mt-1">
                    {results[s.slug]}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-xs text-ink-mute text-center px-4">
        Knowledge Bud v0 · Built with care 🌷
      </p>
    </div>
  );
}
