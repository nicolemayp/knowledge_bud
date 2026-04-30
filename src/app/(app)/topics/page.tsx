"use client";

import { useState } from "react";

const DEFAULT_TOPICS = [
  { id: "cbt", label: "CBT", emoji: "🧠" },
  { id: "dbt", label: "DBT", emoji: "🌊" },
  { id: "trauma", label: "Trauma", emoji: "💗" },
  { id: "ptsd", label: "PTSD", emoji: "🛡️" },
  { id: "depression", label: "Depression", emoji: "🌧️" },
  { id: "anxiety", label: "Anxiety", emoji: "🌀" },
  { id: "mindfulness", label: "Mindfulness", emoji: "🧘" },
  { id: "adolescent", label: "Child & adolescent", emoji: "🌱" },
  { id: "neuroscience", label: "Neuroscience", emoji: "🧬" },
  { id: "psychopharm", label: "Psychopharmacology", emoji: "💊" },
  { id: "addiction", label: "Addiction", emoji: "🔓" },
  { id: "family", label: "Family systems", emoji: "🏠" },
];

export default function TopicsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(DEFAULT_TOPICS.map((t) => [t.id, true]))
  );
  const [custom, setCustom] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  function addCustom(e: React.FormEvent) {
    e.preventDefault();
    const t = draft.trim();
    if (!t) return;
    if (custom.includes(t)) return;
    setCustom([...custom, t]);
    setDraft("");
  }

  function removeCustom(t: string) {
    setCustom(custom.filter((x) => x !== t));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink">Your topics 🌷</h1>
        <p className="text-sm text-ink-soft">
          Toggle topics on/off. Add your own — Knowledge Bud will pull new
          research matching them every month.
        </p>
      </header>

      <section className="rounded-3xl bg-white/85 border border-pink-100 shadow-soft p-5">
        <h2 className="font-display font-bold text-lg mb-3">Default topics</h2>
        <div className="grid grid-cols-2 gap-2">
          {DEFAULT_TOPICS.map((t) => {
            const on = enabled[t.id];
            return (
              <button
                key={t.id}
                onClick={() => setEnabled({ ...enabled, [t.id]: !on })}
                className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-display font-semibold transition-all ${
                  on
                    ? "bg-gradient-to-r from-pink-50 to-lavender-50 border-pink-300 text-ink"
                    : "bg-white border-pink-100 text-ink-mute hover:border-pink-200"
                }`}
              >
                <span className="text-xl">{t.emoji}</span>
                <span className="flex-1">{t.label}</span>
                <span
                  className={`w-3 h-3 rounded-full ${
                    on ? "bg-pink-400" : "bg-pink-100"
                  }`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl bg-white/85 border border-pink-100 shadow-soft p-5">
        <h2 className="font-display font-bold text-lg mb-3">Custom topics</h2>
        <form onSubmit={addCustom} className="flex gap-2 mb-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. EMDR, polyvagal, ACEs"
            className="flex-1 rounded-2xl bg-cream border-2 border-lavender-100 focus:border-lavender-300 outline-none px-4 py-2.5 text-sm font-medium placeholder:text-ink-mute"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="rounded-2xl bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white font-display font-bold text-sm px-5 disabled:opacity-50 transition-all"
          >
            Add
          </button>
        </form>
        {custom.length === 0 ? (
          <p className="text-sm text-ink-mute italic">
            No custom topics yet. Type one and hit Add — we&rsquo;ll match new
            research to it on each refresh.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {custom.map((t) => (
              <span
                key={t}
                className="chip bg-lavender-50 text-lavender-700 border border-lavender-200"
              >
                {t}
                <button
                  onClick={() => removeCustom(t)}
                  className="ml-1 text-lavender-500 hover:text-pink-500"
                  aria-label={`Remove ${t}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-ink-mute text-center px-4">
        Once Neon is connected, your topic preferences will save to the cloud
        DB so they persist across this device&rsquo;s browsers.
      </p>
    </div>
  );
}
