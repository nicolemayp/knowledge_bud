import Groq from "groq-sdk";

let _groq: Groq | null = null;

export function getGroq(): Groq | null {
  if (!process.env.GROQ_API_KEY) return null;
  if (_groq) return _groq;
  _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

export const MODEL = "llama-3.3-70b-versatile";

/**
 * Generate a BLUF (1-sentence finding) + clinical implications (1–2 sentences)
 * from a paper's abstract.
 *
 * Returns null if Groq isn't configured or the call fails.
 */
export type SummariseResult =
  | { bluf: string; clinicalImplications: string }
  | { skip: true }
  | null;

export async function summarisePaper(args: {
  title: string;
  abstract: string;
  evidence?: string;
}): Promise<SummariseResult> {
  const groq = getGroq();
  if (!groq) return null;

  const prompt = [
    "You write summaries of mental-health research papers for working therapists.",
    "Given the abstract below, output strict JSON with three fields:",
    `  - "is_clinical": boolean — true ONLY if this paper has direct relevance to clinical mental-health practice with humans. Set FALSE for: pure-animal studies, in-vitro work, basic neuroscience without clinical implications, device engineering without efficacy data, papers about other medical conditions (cancer, cardiovascular) unless they include a mental-health outcome.`,
    `  - "bluf": ONE sentence (max 30 words). State the main finding in plain English. INCLUDE specific numbers when the abstract has them (sample size, effect size, p-value, percentage change). Avoid vague phrases like "shows promise."`,
    `  - "clinical_implications": ONE-TO-TWO sentences (max 60 words) telling a working therapist how to apply (or NOT apply) this knowledge with real clients. Be concrete: which clients, what to do, how. If the evidence is weak/preliminary/preclinical, say so plainly and recommend NOT changing practice yet.`,
    "Never invent statistics that aren't in the abstract.",
    "Output ONLY the JSON, no preamble.",
    "",
    `Title: ${args.title}`,
    `Evidence: ${args.evidence ?? "unknown"}`,
    `Abstract: ${args.abstract}`,
  ].join("\n");

  try {
    const res = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 400,
      response_format: { type: "json_object" },
    });
    const text = res.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(text);
    if (parsed.is_clinical === false) {
      // Caller should skip insertion of non-clinical papers.
      return { skip: true } as const;
    }
    if (
      typeof parsed.bluf === "string" &&
      typeof parsed.clinical_implications === "string"
    ) {
      return {
        bluf: parsed.bluf.trim(),
        clinicalImplications: parsed.clinical_implications.trim(),
      };
    }
    return null;
  } catch (e) {
    console.error("[ai.summarisePaper] failed:", e);
    return null;
  }
}

/**
 * Answer a user's question using ONLY the provided paper context.
 * Returns the assistant's text + the paper IDs it cited.
 */
export async function askWithContext(args: {
  question: string;
  papers: {
    id: string;
    title: string;
    bluf?: string | null;
    clinicalImplications?: string | null;
    abstract?: string | null;
    journal?: string | null;
    year?: number | null;
    evidence?: string | null;
  }[];
}): Promise<{ answer: string } | null> {
  const groq = getGroq();
  if (!groq) return null;

  const ctx = args.papers
    .slice(0, 12)
    .map((p, i) => {
      const parts = [
        `[${i + 1}] (id=${p.id}) ${p.title}`,
        p.journal ? `   Journal: ${p.journal}${p.year ? ` (${p.year})` : ""}` : "",
        p.evidence ? `   Evidence: ${p.evidence}` : "",
        p.bluf ? `   BLUF: ${p.bluf}` : "",
        p.clinicalImplications
          ? `   Clinical implications: ${p.clinicalImplications}`
          : "",
        p.abstract ? `   Abstract: ${p.abstract.slice(0, 800)}` : "",
      ].filter(Boolean);
      return parts.join("\n");
    })
    .join("\n\n");

  const system = [
    "You are Knowledge Bud — an assistant for therapists and mental-health researchers.",
    "Answer ONLY using the papers provided in <context>. Do not introduce facts outside that context.",
    "Cite papers inline like [1], [2] using the bracket numbers from the context.",
    "If the context doesn't answer the question, say so plainly and suggest what kind of paper would.",
    "Prefer concrete clinical guidance over abstract theory. Note evidence quality (RCT > preprint).",
    "Be concise — 4–6 sentences max — unless the question genuinely needs more depth.",
    "Always remind the user this is an AI summary and they should read the original sources for clinical decisions.",
  ].join("\n");

  try {
    const res = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 600,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `<context>\n${ctx}\n</context>\n\nQuestion: ${args.question}`,
        },
      ],
    });
    const answer = res.choices[0]?.message?.content?.trim() ?? "";
    return { answer };
  } catch (e) {
    console.error("[ai.askWithContext] failed:", e);
    return null;
  }
}
