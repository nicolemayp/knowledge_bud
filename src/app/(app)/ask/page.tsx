"use client";

import { useState } from "react";

export default function AskPage() {
  const [q, setQ] = useState("");
  const [a, setA] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim() || loading) return;
    setLoading(true);
    setA(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setA(
        data.answer ??
          data.error ??
          "Hmm — I couldn't reach the AI. Try again in a moment."
      );
    } catch {
      setA("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink">
          🤖 Ask Knowledge Bud
        </h1>
        <p className="text-sm text-ink-soft">
          Ask anything about the research in your feed. I&rsquo;ll cite the
          papers I pulled from.
        </p>
        <p className="text-[11px] uppercase tracking-wide font-bold text-lavender-500 mt-1">
          AI summary — always verify with the original source.
        </p>
      </header>

      <form
        onSubmit={ask}
        className="rounded-3xl bg-white/85 border border-pink-100 shadow-soft p-4 flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. What does the evidence say about CBT vs DBT for BPD?"
          className="flex-1 rounded-2xl bg-cream border-2 border-lavender-100 focus:border-lavender-300 outline-none px-4 py-3 text-sm font-medium placeholder:text-ink-mute"
        />
        <button
          type="submit"
          disabled={!q.trim() || loading}
          className="rounded-2xl bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white font-display font-bold text-sm px-5 disabled:opacity-50 transition-all"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>

      {a && (
        <div className="rounded-3xl bg-gradient-to-br from-pink-50 via-lavender-50 to-babyblue-50 border border-pink-100 shadow-soft p-5">
          <p className="text-[11px] uppercase tracking-wide font-bold text-lavender-500 mb-2">
            🤖 AI summary
          </p>
          <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
            {a}
          </p>
        </div>
      )}
    </div>
  );
}
