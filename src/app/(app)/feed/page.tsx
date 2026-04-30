"use client";

import { useMemo, useState } from "react";
import { PaperCard } from "@/components/PaperCard";
import { SAMPLE_PAPERS } from "@/lib/sample-papers";

const DEFAULT_TOPICS = [
  "All",
  "CBT",
  "DBT",
  "trauma",
  "PTSD",
  "depression",
  "anxiety",
  "mindfulness",
  "adolescent",
  "neuroscience",
];

export default function FeedPage() {
  const [topic, setTopic] = useState("All");

  const papers = useMemo(() => {
    if (topic === "All") return SAMPLE_PAPERS;
    return SAMPLE_PAPERS.filter((p) =>
      p.topics?.some((t) => t.toLowerCase().includes(topic.toLowerCase()))
    );
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
          1st of next month).
        </p>
      </div>

      {/* Topic chips — sticky-ish at top */}
      <div className="-mx-4 px-4 mb-5 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {DEFAULT_TOPICS.map((t) => {
            const active = topic === t;
            return (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className={`chip border whitespace-nowrap font-display ${
                  active
                    ? "bg-gradient-to-r from-pink-400 to-lavender-400 text-white border-transparent shadow-soft"
                    : "bg-white/80 text-ink-soft border-pink-100 hover:border-pink-300"
                }`}
              >
                {t}
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
              No papers in this topic yet
            </p>
            <p className="text-sm text-ink-soft">
              Try another filter or hit refresh in Settings.
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
