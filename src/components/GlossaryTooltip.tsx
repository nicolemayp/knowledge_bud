"use client";

import { useState, useEffect, useRef } from "react";
import { GLOSSARY_SEED } from "@/lib/glossary-data";

const TERMS = GLOSSARY_SEED.map((g) => ({
  ...g,
  pattern: new RegExp(`\\b(${escape(g.term)})\\b`, "gi"),
}));

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlights known glossary terms inside a text block. Tap a term → tooltip
 * with the definition. No DB calls — uses the seeded dictionary client-side.
 */
export function Glossarized({ text }: { text: string }) {
  // Build a list of {start, end, term} matches across all glossary terms.
  const matches: { start: number; end: number; term: string }[] = [];
  for (const t of TERMS) {
    let m: RegExpExecArray | null;
    const re = new RegExp(t.pattern.source, t.pattern.flags);
    while ((m = re.exec(text)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, term: t.term });
    }
  }
  matches.sort((a, b) => a.start - b.start);

  // Resolve overlaps — keep first.
  const filtered: typeof matches = [];
  let lastEnd = -1;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }

  if (filtered.length === 0) return <>{text}</>;

  const out: React.ReactNode[] = [];
  let cursor = 0;
  filtered.forEach((m, i) => {
    if (m.start > cursor) out.push(text.slice(cursor, m.start));
    out.push(
      <GlossaryPill key={`${i}-${m.start}`} term={text.slice(m.start, m.end)} />
    );
    cursor = m.end;
  });
  if (cursor < text.length) out.push(text.slice(cursor));
  return <>{out}</>;
}

function GlossaryPill({ term }: { term: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const entry = GLOSSARY_SEED.find(
    (g) => g.term.toLowerCase() === term.toLowerCase()
  );

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-baseline gap-0.5 text-pink-600 underline decoration-dotted decoration-pink-300 underline-offset-2 hover:text-pink-700 hover:decoration-pink-500 font-semibold"
        aria-label={`Define ${term}`}
      >
        {term}
        <span className="text-[10px] opacity-60" aria-hidden="true">ⓘ</span>
      </button>
      {open && entry && (
        <span
          role="tooltip"
          className="absolute left-0 top-full mt-1 w-64 z-50 rounded-2xl bg-white border border-pink-200 shadow-pop p-3 text-xs text-ink-soft leading-relaxed font-normal not-italic normal-case"
        >
          <span className="block font-display font-bold text-ink mb-1">
            {entry.term}
            {entry.category && (
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-lavender-500">
                {entry.category}
              </span>
            )}
          </span>
          {entry.definition}
        </span>
      )}
    </span>
  );
}
