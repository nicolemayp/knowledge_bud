/**
 * Compute reading time + a rough jargon level for an abstract.
 * Heuristic only — used for the "3 min read · Plain English" badge.
 */

const WORDS_PER_MIN = 200;

// Words common in clinical/research writing that signal jargon.
// Not exhaustive — just a coarse signal for the UI.
const JARGON_WORDS = new Set([
  "heteroscedasticity",
  "multicollinearity",
  "psychometric",
  "factor analysis",
  "confirmatory",
  "exploratory factor",
  "structural equation",
  "hierarchical linear",
  "bonferroni",
  "intraclass correlation",
  "icc",
  "kappa",
  "cronbach",
  "moderator",
  "mediator",
  "moderation",
  "mediation",
  "bootstrap",
  "longitudinal",
  "cross-sectional",
  "regression",
  "logistic",
  "covariate",
  "confound",
  "residual",
  "ancova",
  "manova",
  "anova",
  "etiology",
  "prodromal",
  "neuroinflammation",
  "neuroplasticity",
  "amygdala",
  "prefrontal",
  "cingulate",
  "hippocampus",
  "polymorphism",
  "phenotype",
  "endophenotype",
]);

export type JargonLevel = "plain" | "medium" | "heavy";

export function computeReading(text: string | null | undefined): {
  readingMinutes: number | null;
  jargon: JargonLevel | null;
} {
  if (!text) return { readingMinutes: null, jargon: null };
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return { readingMinutes: null, jargon: null };

  const words = cleaned.split(" ");
  const wordCount = words.length;
  const readingMinutes = Math.max(1, Math.round(wordCount / WORDS_PER_MIN));

  let jargonHits = 0;
  const lower = cleaned.toLowerCase();
  for (const w of JARGON_WORDS) {
    if (lower.includes(w)) jargonHits++;
  }
  // Average word length contributes too — academic writing tends to use longer words.
  const avgLen =
    words.reduce((s, w) => s + w.replace(/[^a-z]/gi, "").length, 0) /
    Math.max(1, wordCount);

  let score = jargonHits * 1.5 + Math.max(0, avgLen - 5);
  // 0–2: plain, 2–5: medium, >5: heavy
  const jargon: JargonLevel =
    score < 2 ? "plain" : score < 5 ? "medium" : "heavy";

  return { readingMinutes, jargon };
}
