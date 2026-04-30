type Tone = "pink" | "lavender" | "babyblue" | "neutral";

const tones: Record<Tone, string> = {
  pink: "bg-pink-100 text-pink-600 border-pink-200",
  lavender: "bg-lavender-100 text-lavender-600 border-lavender-200",
  babyblue: "bg-babyblue-100 text-babyblue-600 border-babyblue-200",
  neutral: "bg-white/70 text-ink-soft border-pink-100",
};

export function SourceBadge({
  source,
  tone = "neutral",
}: {
  source: string;
  tone?: Tone;
}) {
  return (
    <span className={`chip border ${tones[tone]}`}>
      <span aria-hidden="true">📚</span>
      <span>{source}</span>
    </span>
  );
}

export function EvidenceBadge({ kind }: { kind: string }) {
  const map: Record<string, { tone: Tone; label: string; emoji: string }> = {
    rct: { tone: "babyblue", label: "RCT", emoji: "🎯" },
    "meta-analysis": { tone: "lavender", label: "Meta-analysis", emoji: "📊" },
    review: { tone: "lavender", label: "Review", emoji: "🔍" },
    cohort: { tone: "babyblue", label: "Cohort", emoji: "👥" },
    "case-study": { tone: "pink", label: "Case study", emoji: "📝" },
    preprint: { tone: "pink", label: "Preprint", emoji: "🌱" },
    qualitative: { tone: "pink", label: "Qualitative", emoji: "💭" },
  };
  const conf = map[kind] ?? { tone: "neutral" as Tone, label: kind, emoji: "📄" };
  return (
    <span className={`chip border ${tones[conf.tone]}`}>
      <span aria-hidden="true">{conf.emoji}</span>
      <span>{conf.label}</span>
    </span>
  );
}
