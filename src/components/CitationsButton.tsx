"use client";

import { useState } from "react";

type Cite = {
  doi: string | null;
  title: string;
  author: string | null;
  year: number | null;
  journal: string | null;
  url: string | null;
};

export function CitationsButton({ doi }: { doi: string | null }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [cites, setCites] = useState<Cite[]>([]);
  const [citedBy, setCitedBy] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  if (!doi) return null;

  async function load() {
    if (loaded) return;
    try {
      const res = await fetch(`/api/citations/${encodeURIComponent(doi!)}`);
      const data = await res.json();
      if (res.ok) {
        setCites(data.cites ?? []);
        setCitedBy(data.citedByCount ?? 0);
      } else setErr(data.error ?? "Failed");
    } catch {
      setErr("Network error");
    } finally {
      setLoaded(true);
    }
  }

  function toggle() {
    if (!open) load();
    setOpen((v) => !v);
  }

  return (
    <>
      <button
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 rounded-full border-2 font-display font-semibold text-sm px-4 py-2 transition-all ${
          open
            ? "bg-lavender-100 border-lavender-300 text-lavender-700"
            : "border-lavender-200 hover:border-lavender-300 text-lavender-600"
        }`}
        aria-label="Citation lineage"
      >
        🌳 Lineage
      </button>
      {open && (
        <div className="mt-3 rounded-2xl bg-cream border border-lavender-100 p-3 w-full">
          <p className="text-[11px] uppercase tracking-wide font-bold text-lavender-500 mb-2">
            🌳 Citation lineage · cited by {citedBy} papers
          </p>
          {!loaded && <p className="text-sm text-ink-mute">Loading…</p>}
          {loaded && err && (
            <p className="text-sm text-pink-600">⚠ {err}</p>
          )}
          {loaded && !err && cites.length === 0 && (
            <p className="text-sm text-ink-mute italic">
              No reference list available from Crossref.
            </p>
          )}
          {loaded && !err && cites.length > 0 && (
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {cites.map((c, i) => (
                <li
                  key={i}
                  className="text-xs text-ink-soft leading-snug border-l-2 border-lavender-200 pl-2"
                >
                  <span className="font-display font-semibold text-ink">
                    {c.title}
                  </span>
                  {c.author && <span>{` · ${c.author}`}</span>}
                  {c.journal && <span>{` · ${c.journal}`}</span>}
                  {c.year && <span>{` (${c.year})`}</span>}
                  {c.url && (
                    <>
                      {" · "}
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 underline"
                      >
                        link ↗
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
