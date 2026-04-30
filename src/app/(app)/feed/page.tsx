"use client";

import { useMemo, useState } from "react";
import { PaperCard } from "@/components/PaperCard";
import { SAMPLE_PAPERS } from "@/lib/sample-papers";
import { TOPICS } from "@/lib/topics";

const FEATURED_TOPIC_IDS = [
  "cbt", "dbt", "act", "emdr", "ifs", "somatic", "polyvagal", "music", "art",
  "attention", "neuroplasticity", "sleep", "stress", "interoception",
  "attachment", "trauma", "ptsd", "depression", "anxiety", "ocd",
  "adolescent", "addiction", "burnout", "psychedelics",
];
const FEATURED = TOPICS.filter((t) => FEATURED_TOPIC_IDS.includes(t.id));

function matches(paper: { topics?: string[]; bluf?: string }, q: string) {
  const lower = q.toLowerCase();
  if (paper.topics?.some((t) => t.toLowerCase().includes(lower))) return true;
  if (paper.bluf?.toLowerCase().includes(lower)) return true;
  return false;
}

export default function FeedPage() {
  const [topic, setTopic] = useState("all");

  const papers = useMemo(() => {
    if (topic === "all") return SAMPLE_PAPERS;
    return SAMPLE_PAPERS.filter((p) => matches(p, topic));
  }, [topic]);

  return (
    <div>
      {/* Banner: sample data */}
      <div className="rounded-2xl bg-gradient-to-r from-pink-100 via-lavender-100 to-babyblue-100 border border-pink-200 px-4 py-3 mb-4 text-sm">
        <p className="font-display font-semibold text-pink-700">
          🌸 Welcome! These are <span className="underline decoration-wavy">sample papers</span> while we connect your sources.
        </p>
        <p className="text-ink-soft text-xs mt-0.5">
          Real research will replace them after the first refresh (or on the
          1st of next month). Tap underlined terms to define them.
        </p>
      </div>

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
        {papers.length === 0 && (
          <div className="rounded-3xl bg-white/70 border border-pink-100 p-8 text-center">
            <p className="text-3xl mb-2">🌷</p>
            <p className="font-display font-bold text-ink mb-1">
              No papers match this topic yet
            </p>
            <p className="text-sm text-ink-soft">
              Try another filter, or hit refresh in Settings to pull fresh
              papers from PubMed.
            </p>
          </div>
        )}
        {papers.map((p) => (
          <PaperCard key={p.id} paper={p} />
        ))}
      </div>
    </div>
  );
}
