"use client";

import { useState, useRef, useEffect } from "react";

/**
 * Floating AI chat button — bottom-right, above the bottom tab nav.
 * Click → opens a soft sheet with a quick-ask input + answer. Full
 * conversation lives at /ask.
 */
export function AskFab() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [a, setA] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

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
      setA(data.answer ?? data.error ?? "Couldn't reach the AI. Try again.");
    } catch {
      setA("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI chat" : "Open AI chat"}
        className={`fixed right-4 bottom-[88px] z-40 w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 via-lavender-400 to-babyblue-400 hover:from-pink-500 hover:via-lavender-500 hover:to-babyblue-500 shadow-pop flex items-center justify-center text-2xl transition-all active:scale-95 ${
          open ? "rotate-45" : "hover:rotate-12"
        }`}
      >
        {open ? "×" : "🤖"}
      </button>

      {/* Sheet */}
      {open && (
        <div className="fixed inset-x-0 bottom-[80px] z-30 px-4 sm:right-4 sm:left-auto sm:w-[400px] pointer-events-none">
          <div className="rounded-3xl bg-white/95 backdrop-blur-xl border border-pink-200 shadow-pop p-4 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-bold text-ink flex items-center gap-1.5">
                <span>🤖</span> Ask Knowledge Bud
              </span>
              <a
                href="/ask"
                className="text-[11px] font-display font-semibold text-lavender-600 hover:text-lavender-700"
              >
                Full chat →
              </a>
            </div>
            <p className="text-[11px] uppercase tracking-wide font-bold text-lavender-500 mb-2">
              AI summary — verify with sources
            </p>
            <form onSubmit={ask} className="flex gap-2">
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ask about the research…"
                className="flex-1 rounded-2xl bg-cream border-2 border-lavender-100 focus:border-lavender-300 outline-none px-3 py-2 text-sm font-medium placeholder:text-ink-mute"
              />
              <button
                type="submit"
                disabled={!q.trim() || loading}
                className="rounded-2xl bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white font-display font-bold text-sm px-3 disabled:opacity-50 transition-all"
              >
                {loading ? "…" : "Ask"}
              </button>
            </form>
            {a && (
              <div className="mt-3 rounded-2xl bg-gradient-to-br from-pink-50 via-lavender-50 to-babyblue-50 border border-pink-100 p-3 max-h-64 overflow-y-auto">
                <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
                  {a}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
