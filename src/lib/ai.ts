import Groq from "groq-sdk";

let _groq: Groq | null = null;

export function getGroq(): Groq | null {
  if (!process.env.GROQ_API_KEY) return null;
  if (_groq) return _groq;
  _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

// Big model for chat (askWithContext) — slow but smart.
export const MODEL_CHAT = "llama-3.3-70b-versatile";
// Smaller model for paper summaries — much higher TPM headroom on free tier.
export const MODEL_SUMMARY = "llama-3.1-8b-instant";
// Back-compat for callers
export const MODEL = MODEL_CHAT;

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
    "You write summaries of mental-health research for working therapists scrolling on the go. They need to understand the study and the practical takeaway in under 30 seconds.",
    "Given the abstract below, output strict JSON with three fields:",
    `  - "is_clinical": boolean — true ONLY if this paper has direct relevance to clinical mental-health practice with humans. Set FALSE for: pure-animal studies, in-vitro work, basic neuroscience without clinical implications, device engineering without efficacy data, or papers focused on a non-mental-health condition (cancer, cardiovascular, dental, etc.) UNLESS they include a clear mental-health outcome.`,
    "",
    `  - "bluf": THREE concise sentences (45-80 words). Reads like a great Instagram caption — a clinician screenshots and gets the whole story. Structure:`,
    `      S1 — WHO was studied + WHAT was tested. Be concrete: population size, age, condition, intervention, comparison. e.g. "186 adults with treatment-resistant depression were randomized to 12 weeks of MBCT or treatment-as-usual."`,
    `      S2 — THE FINDING with specific numbers if available (effect size, % change, p-value, sample size). e.g. "MBCT cut depression scores by 38% (Cohen's d=0.71, p<0.001); TAU barely moved."`,
    `      S3 — A short caveat / quality note. e.g. "Single-blind, but effect held at 6-month follow-up." Skip if nothing meaningful to add.`,
    `    Plain English, active voice. NO vague phrases like "shows promise" or "more research needed."`,
    "",
    `  - "clinical_implications": FOUR full sentences (90-130 words). This is the working-clinician's translation of the paper. Structure:`,
    `      S1 — Briefly recap WHAT the study did, in plain practitioner-language (not stats-speak). e.g. "Researchers compared an 8-week mindfulness app against waitlist for clients with chronic worry."`,
    `      S2 — WHO this applies to in your practice. Be specific about client characteristics, presenting problems, settings (e.g. "outpatient adults with mild-to-moderate generalized anxiety, especially those who can't access weekly therapy")`,
    `      S3 — WHAT TO DO with this knowledge. Concrete clinical move: a referral, a homework prompt, a question to ask in session, an intervention to consider, a measure to track. Avoid generic advice.`,
    `      S4 — WHEN TO BE CAREFUL or what the evidence does NOT support. Note quality (RCT vs. preprint vs. cohort), generalizability concerns, populations excluded, or follow-up gaps. If the evidence is preliminary, say so plainly and tell the clinician NOT to change practice yet.`,
    "",
    "Never invent statistics that aren't in the abstract. If a number isn't stated, just describe direction.",
    "Output ONLY the JSON, no preamble.",
    "",
    `Title: ${args.title}`,
    `Evidence: ${args.evidence ?? "unknown"}`,
    `Abstract: ${args.abstract}`,
  ].join("\n");

  try {
    const res = await groq.chat.completions.create({
      model: MODEL_SUMMARY,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 700,
      response_format: { type: "json_object" },
    });
    const text = res.choices[0]?.message?.content ?? "";
    let parsed: { is_clinical?: boolean; bluf?: string; clinical_implications?: string };
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.error("[ai.summarisePaper] JSON parse failed:", parseErr, "raw:", text.slice(0, 200));
      return null;
    }
    if (parsed.is_clinical === false) {
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
    console.warn("[ai.summarisePaper] missing fields in response:", JSON.stringify(parsed).slice(0, 200));
    return null;
  } catch (e) {
    const err = e as { status?: number; message?: string };
    console.error("[ai.summarisePaper] failed:", err.status, err.message?.slice(0, 200));
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
