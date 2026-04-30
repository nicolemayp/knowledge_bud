"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PaperCard, type PaperLike } from "@/components/PaperCard";

type DbPaper = {
  id: string;
  sourceSlug: string;
  externalId: string;
  title: string;
  abstract: string | null;
  bluf: string | null;
  clinicalImplications: string | null;
  blufIsAi: boolean;
  authors: string[];
  journal: string | null;
  year: number | null;
  topics: string[];
  url: string;
  readingMinutes: number | null;
  jargon: "plain" | "medium" | "heavy" | null;
  evidence: string;
};

const SOURCE_LABEL: Record<
  string,
  { label: string; tone: "pink" | "lavender" | "babyblue" | "neutral" }
> = {
  pubmed: { label: "PubMed", tone: "babyblue" },
  openalex: { label: "OpenAlex", tone: "babyblue" },
  europepmc: { label: "Europe PMC", tone: "lavender" },
  medrxiv: { label: "medRxiv", tone: "pink" },
  semanticscholar: { label: "Semantic Scholar", tone: "lavender" },
  crossref: { label: "Crossref", tone: "babyblue" },
};

function dbToPaperLike(p: DbPaper): PaperLike {
  const src = SOURCE_LABEL[p.sourceSlug] ?? { label: p.sourceSlug, tone: "neutral" as const };
  return {
    id: p.id,
    title: p.title,
    bluf: p.bluf ?? p.title,
    clinicalImplications: p.clinicalImplications,
    abstract: p.abstract,
    authors: p.authors ?? [],
    journal: p.journal,
    year: p.year,
    source: src.label,
    sourceTone: src.tone,
    evidenceKind: p.evidence !== "unknown" ? p.evidence : null,
    url: p.url,
    topics: p.topics ?? [],
    readingMinutes: p.readingMinutes,
    jargon: p.jargon,
    isAiSummarized: p.blufIsAi,
  };
}

export default function SavedPage() {
  const [papers, setPapers] = useState<PaperLike[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list = (data.bookmarks ?? []).map((b: { paper: DbPaper }) =>
          dbToPaperLike(b.paper)
        );
        setPapers(list);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink">
          🔖 Saved
        </h1>
        <p className="text-sm text-ink-soft">
          Papers you&rsquo;ve bookmarked. {papers.length > 0 ? `${papers.length} saved.` : ""}
        </p>
      </header>

      {!loaded && (
        <div className="rounded-3xl bg-white/60 border border-pink-100 p-8 text-center text-ink-mute text-sm">
          Loading…
        </div>
      )}

      {loaded && papers.length === 0 && (
        <div className="rounded-3xl bg-white/70 border border-pink-100 p-8 text-center">
          <p className="text-3xl mb-2">🌷</p>
          <p className="font-display font-bold text-ink mb-1">
            No saved papers yet
          </p>
          <p className="text-sm text-ink-soft mb-4">
            Tap the 🔖 Save button on any paper in the Feed to bookmark it for
            later.
          </p>
          <Link
            href="/feed"
            className="inline-block rounded-2xl bg-gradient-to-r from-pink-400 to-lavender-400 hover:from-pink-500 hover:to-lavender-500 text-white font-display font-bold px-5 py-2.5 shadow-soft"
          >
            ← Back to Feed
          </Link>
        </div>
      )}

      {loaded && papers.map((p) => <PaperCard key={p.id} paper={p} />)}
    </div>
  );
}
