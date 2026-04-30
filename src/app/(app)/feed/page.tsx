"use client";

import { useEffect, useMemo, useState } from "react";
import { PaperCard, type PaperLike } from "@/components/PaperCard";
import { SAMPLE_PAPERS } from "@/lib/sample-papers";
import { TOPICS } from "@/lib/topics";

const FEATURED_TOPIC_IDS = [
  "cbt", "dbt", "act", "emdr", "ifs", "somatic", "polyvagal", "music", "art",
  "attention", "neuroplasticity", "sleep", "stress", "interoception",
  "attachment", "trauma", "ptsd", "depression", "anxiety", "ocd",
  "adolescent", "addiction", "burnout", "psychedelics",
];
const FEATURED = TOPICS.filter((t) => FEATURED_TOPIC_IDS.includes(t.id));

function matches(paper: { topics?: string[] | null; bluf?: string | null }, q: string) {
  const lower = q.toLowerCase();
  if (paper.topics?.some((t) => t.toLowerCase().includes(lower))) return true;
  if (paper.bluf?.toLowerCase().includes(lower)) return true;
  return false;
}

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

const SOURCE_LABEL: Record<string, { label: string; tone: "pink" | "lavender" | "babyblue" | "neutral" }> = {
  pubmed: { label: "PubMed", tone: "babyblue" },
  openalex: { label: "OpenAlex", tone: "babyblue" },
  europepmc: { label: "Europe PMC", tone: "lavender" },
  medrxiv: { label: "medRxiv", tone: "pink" },
  semanticscholar: { label: "Semantic Scholar", tone: "lavender" },
  plos: { label: "PLOS", tone: "lavender" },
  doaj: { label: "DOAJ", tone: "neutral" },
  crossref: { label: "Crossref", tone: "babyblue" },
  nimh: { label: "NIMH", tone: "lavender" },
  samhsa: { label: "SAMHSA", tone: "pink" },
  "who-mh": { label: "WHO", tone: "babyblue" },
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

export default function FeedPage() {
  const [topic, setTopic] = useState("all");
  const [livePapers, setLivePapers] = useState<PaperLike[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/papers")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.papers) && data.papers.length > 0) {
          setLivePapers(data.papers.map(dbToPaperLike));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const all: PaperLike[] = livePapers ?? SAMPLE_PAPERS;
  const usingSamples = livePapers === null;

  const papers = useMemo(() => {
    if (topic === "all") return all;
    return all.filter((p) => matches(p, topic));
  }, [topic, all]);

  return (
    <div>
      {/* Banner */}
      {usingSamples ? (
        <div className="rounded-2xl bg-gradient-to-r from-pink-100 via-lavender-100 to-babyblue-100 border border-pink-200 px-4 py-3 mb-4 text-sm">
          <p className="font-display font-semibold text-pink-700">
            🌸 Welcome! These are <span className="underline decoration-wavy">sample papers</span> while we connect your sources.
          </p>
          <p className="text-ink-soft text-xs mt-0.5">
            Hit Refresh on a source in <strong>Settings</strong> to pull real research, or wait for the 1st-of-month auto-update.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-gradient-to-r from-babyblue-100 via-pink-100 to-lavender-100 border border-babyblue-200 px-4 py-3 mb-4 text-sm">
          <p className="font-display font-semibold text-babyblue-700">
            ✨ Showing {all.length} live paper{all.length === 1 ? "" : "s"} from your sources.
          </p>
          <p className="text-ink-soft text-xs mt-0.5">
            Tap underlined terms for quick definitions. AI-generated summaries are clearly labeled.
          </p>
        </div>
      )}

      {/* Topic pills row */}
      <div className="-mx-4 px-4 mb-5 overflow-x-auto pb-1">
        <div className="flex gap-2 w-max">
          <button
            onClick={() => setTopic("all")}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-display font-semibold border-2 whitespace-nowrap transition-all ${
              topic === "all"
                ? "bg-gradient-to-r from-pink-400 to-lavender-400 text-white border-transparent shadow-soft scale-105"
                : "bg-white/80 text-ink-soft border-pink-100 hover:border-pink-300 hover:text-pink-600"
            }`}
          >
            <span aria-hidden="true">✨</span>
            <span>All</span>
          </button>
          {FEATURED.map((t) => {
            const active = topic === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTopic(t.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-display font-semibold border-2 whitespace-nowrap transition-all ${
                  active
                    ? "bg-gradient-to-r from-pink-400 to-lavender-400 text-white border-transparent shadow-soft scale-105"
                    : "bg-white/80 text-ink-soft border-pink-100 hover:border-pink-300 hover:text-pink-600"
                }`}
              >
                <span aria-hidden="true">{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {!loaded && (
          <div className="rounded-3xl bg-white/60 border border-pink-100 p-8 text-center text-ink-mute text-sm">
            Loading…
          </div>
        )}
        {loaded && papers.length === 0 && (
          <div className="rounded-3xl bg-white/70 border border-pink-100 p-8 text-center">
            <p className="text-3xl mb-2">🌷</p>
            <p className="font-display font-bold text-ink mb-1">
              No papers match this topic yet
            </p>
            <p className="text-sm text-ink-soft">
              Try another filter, or hit refresh in Settings to pull fresh papers.
            </p>
          </div>
        )}
        {loaded && papers.map((p) => <PaperCard key={p.id} paper={p} />)}
      </div>
    </div>
  );
}
