"use client";

import { useEffect, useState, useMemo } from "react";
import { TOPICS, TOPIC_GROUPS } from "@/lib/topics";

type DbTopic = {
  key: string;
  label: string;
  kind: "default" | "custom";
  enabled: boolean;
};

export default function TopicsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [custom, setCustom] = useState<{ key: string; label: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load existing prefs from DB
  useEffect(() => {
    let cancelled = false;
    fetch("/api/topics")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const dbMap: Record<string, boolean> = {};
        const dbCustom: { key: string; label: string }[] = [];
        (data.topics ?? []).forEach((t: DbTopic) => {
          if (t.kind === "custom") {
            if (t.enabled) dbCustom.push({ key: t.key, label: t.label });
          } else {
            dbMap[t.key] = t.enabled;
          }
        });
        setEnabled(dbMap);
        setCustom(dbCustom);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(
    () =>
      TOPIC_GROUPS.map((g) => ({
        ...g,
        topics: TOPICS.filter((t) => t.group === g.id),
      })),
    []
  );

  async function toggleDefault(key: string, label: string) {
    const next = !enabled[key];
    setEnabled({ ...enabled, [key]: next });
    setSavingKey(key);
    try {
      await fetch("/api/topics", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, label, kind: "default", enabled: next }),
      });
    } finally {
      setSavingKey(null);
    }
  }

  async function addCustom(e: React.FormEvent) {
    e.preventDefault();
    const t = draft.trim();
    if (!t) return;
    const key = `custom:${t.toLowerCase().replace(/\s+/g, "-")}`;
    if (custom.some((c) => c.key === key)) return;
    setCustom([...custom, { key, label: t }]);
    setDraft("");
    await fetch("/api/topics", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, label: t, kind: "custom", enabled: true }),
    });
  }

  async function removeCustom(key: string) {
    setCustom(custom.filter((c) => c.key !== key));
    await fetch("/api/topics", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key }),
    });
  }

  const enabledCount = Object.values(enabled).filter(Boolean).length;

  return (
    <div className="space-y-6 pb-2">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink">
          Your topics 🌷
        </h1>
        <p className="text-sm text-ink-soft">
          Pick what to follow. Each refresh pulls new research matching your
          enabled topics. Add anything specific in <em>Custom topics</em>.
        </p>
        <p className="text-[11px] text-ink-mute mt-1">
          {!loaded
            ? "Loading…"
            : `${enabledCount} default topic${
                enabledCount === 1 ? "" : "s"
              } on · ${custom.length} custom · saved to your account`}
        </p>
      </header>

      {grouped.map((g) => (
        <section
          key={g.id}
          className="rounded-3xl bg-white/85 border border-pink-100 shadow-soft p-5"
        >
          <h2 className="font-display font-bold text-lg mb-3">
            <span className="mr-2 text-xl" aria-hidden="true">
              {g.emoji}
            </span>
            {g.label}
            <span className="text-xs text-ink-mute ml-2 font-normal">
              ({g.topics.length})
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {g.topics.map((t) => {
              const on = enabled[t.id] ?? false;
              const saving = savingKey === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => toggleDefault(t.id, t.label)}
                  disabled={saving}
                  className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-display font-semibold transition-all ${
                    on
                      ? "bg-gradient-to-r from-pink-50 to-lavender-50 border-pink-300 text-ink"
                      : "bg-white border-pink-100 text-ink-mute hover:border-pink-200"
                  } ${saving ? "opacity-50" : ""}`}
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
      ))}

      <section className="rounded-3xl bg-white/85 border border-pink-100 shadow-soft p-5">
        <h2 className="font-display font-bold text-lg mb-3">
          <span className="mr-2" aria-hidden="true">✨</span>Custom topics
        </h2>
        <form onSubmit={addCustom} className="flex gap-2 mb-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. EMDR for first responders, attachment in adoption"
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
            {custom.map((c) => (
              <span
                key={c.key}
                className="chip bg-lavender-50 text-lavender-700 border border-lavender-200"
              >
                {c.label}
                <button
                  onClick={() => removeCustom(c.key)}
                  className="ml-1 text-lavender-500 hover:text-pink-500"
                  aria-label={`Remove ${c.label}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
