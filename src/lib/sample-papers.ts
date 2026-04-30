import type { PaperLike } from "@/components/PaperCard";

/**
 * Sample papers — shown only when the DB is empty (e.g. first launch
 * before the cron has run). They are clearly labeled as samples in the
 * Feed UI so users know real papers will replace them after refresh.
 */
export const SAMPLE_PAPERS: PaperLike[] = [
  {
    id: "sample-1",
    title:
      "Effects of brief mindfulness training on rumination in adults with depression: a randomised trial",
    bluf: "8 weeks of brief, app-delivered mindfulness reduced rumination by ~28% in adults with mild-to-moderate depression.",
    clinicalImplications:
      "For patients with mild-to-moderate depression who can't access weekly therapy, a structured 8-week mindfulness app (e.g. 10-min daily sessions) is a low-cost adjunct that targets rumination specifically. Consider as homework alongside CBT, or as a stepping-stone before formal treatment.",
    abstract:
      "Background: Rumination is a robust predictor of depression maintenance. Methods: 312 adults randomised to a brief mindfulness app (n=156) or active control (n=156) for 8 weeks. Results: Mindfulness arm showed −28% rumination on the RRS (95% CI −34 to −22, p<0.001) vs −9% control. Effect maintained at 6-month follow-up. Conclusion: Low-cost, scalable intervention with meaningful symptom impact.",
    authors: ["A. Patel", "M. Chen", "S. Okafor"],
    journal: "Journal of Affective Disorders",
    year: 2026,
    source: "PubMed",
    sourceTone: "babyblue",
    evidenceKind: "rct",
    url: "https://pubmed.ncbi.nlm.nih.gov/",
    topics: ["mindfulness", "depression", "digital health"],
    readingMinutes: 4,
    jargon: "medium",
    keyStats: [
      { label: "n", value: "312" },
      { label: "Δ rumination", value: "−28%" },
      { label: "p", value: "<0.001" },
    ],
  },
  {
    id: "sample-2",
    title:
      "DBT skills training for adolescents with self-harm: meta-analysis of 14 RCTs",
    bluf: "Across 14 trials and 1,847 adolescents, DBT skills training cut self-harm episodes by roughly half vs. usual care.",
    clinicalImplications:
      "DBT-A skills groups (mindfulness, distress tolerance, emotion regulation, interpersonal effectiveness) should be the first-line consideration for adolescents with recurrent self-harm. The 24-week format is most-supported. If you don't run a full DBT program, refer to one — even partial DBT exposure is associated with meaningful reductions.",
    abstract:
      "Aim: Quantify the efficacy of DBT-A on self-harm in adolescents. Methods: Random-effects meta-analysis of 14 RCTs (k=14, N=1,847). Results: pooled risk ratio 0.52 (95% CI 0.41–0.66) for self-harm at 6 months. Heterogeneity moderate (I²=42%). Conclusion: DBT-A is a robustly effective intervention; therapist training capacity is the main barrier to scale.",
    authors: ["L. Martinez", "K. Hayward", "R. Begum", "J. Liu"],
    journal: "JAMA Psychiatry",
    year: 2026,
    source: "Europe PMC",
    sourceTone: "lavender",
    evidenceKind: "meta-analysis",
    url: "https://europepmc.org/",
    topics: ["DBT", "adolescent", "self-harm"],
    readingMinutes: 5,
    jargon: "medium",
    keyStats: [
      { label: "k (trials)", value: "14" },
      { label: "RR", value: "0.52" },
      { label: "N", value: "1,847" },
    ],
  },
  {
    id: "sample-3",
    title:
      "Psilocybin-assisted therapy for treatment-resistant PTSD: phase 2 results",
    bluf: "Two psilocybin sessions plus integration therapy produced clinically meaningful PTSD reduction in 67% of treatment-resistant patients at 12 weeks.",
    clinicalImplications:
      "Encouraging early evidence — but this is phase 2, in a controlled medical setting with screened participants. Don't change practice yet. For clinicians: track which patients might benefit from emerging psychedelic-assisted therapy programs as they become legally available, and stay current on integration-therapy frameworks (somatic, parts work, meaning-making).",
    abstract:
      "Background: TR-PTSD has limited options. Methods: open-label phase 2, 60 adults with TR-PTSD, 25mg psilocybin × 2 with manualised integration therapy. Results: 67% achieved ≥30% PCL-5 reduction at week 12. Mean PCL-5 −18 points (95% CI −22 to −14). Adverse events: transient headache, anxiety; no serious AEs. Conclusion: Encouraging signal; phase 3 RCT underway.",
    authors: ["E. Schmidt", "T. Wallace", "P. Kapoor"],
    journal: "Nature Medicine",
    year: 2026,
    source: "PubMed",
    sourceTone: "babyblue",
    evidenceKind: "rct",
    url: "https://pubmed.ncbi.nlm.nih.gov/",
    topics: ["PTSD", "psychedelics", "trauma"],
    readingMinutes: 6,
    jargon: "heavy",
    keyStats: [
      { label: "n", value: "60" },
      { label: "Responders", value: "67%" },
      { label: "ΔPCL-5", value: "−18" },
    ],
  },
  {
    id: "sample-4",
    title: "Loneliness and inflammatory biomarkers: 10-year cohort findings",
    bluf: "Sustained loneliness across 10 years was linked to ~22% higher CRP and IL-6, independent of depression and lifestyle factors.",
    clinicalImplications:
      "When patients describe persistent loneliness, treat it as a clinically significant target — not a 'soft' complaint. Loneliness has measurable physical-health downstream effects. Evidence-based interventions: behavioral activation, group therapy, addressing maladaptive social cognitions (e.g. 'no one would want to spend time with me'), and connecting patients to community structures.",
    abstract:
      "Methods: longitudinal cohort (N=4,210, mean age 58). Loneliness assessed annually (UCLA-3). Inflammatory markers measured at baseline and Y10. Results: persistent loneliness predicted higher CRP (β=0.22, p<0.001) and IL-6 (β=0.18, p<0.001) at Y10, after adjusting for depression, BMI, smoking, and SES.",
    authors: ["H. Tanaka", "M. Russo"],
    journal: "Psychological Medicine",
    year: 2025,
    source: "OpenAlex",
    sourceTone: "babyblue",
    evidenceKind: "cohort",
    url: "https://openalex.org/",
    topics: ["loneliness", "psychoneuroimmunology"],
    readingMinutes: 4,
    jargon: "heavy",
    keyStats: [
      { label: "n", value: "4,210" },
      { label: "ΔCRP", value: "+22%" },
      { label: "Years", value: "10" },
    ],
  },
  {
    id: "sample-5",
    title: "Polyvagal-informed somatic therapy for complex PTSD (preprint)",
    bluf: "Pilot trial of a 16-session polyvagal protocol shows promise for complex PTSD — but small sample size means treat as hypothesis-generating only.",
    clinicalImplications:
      "Don't pivot your practice based on this alone — it's a preprint with N=42 and no active comparator. But if you already incorporate somatic and polyvagal elements, this provides preliminary support. Watch for the peer-reviewed version. Continue to anchor your C-PTSD work in higher-evidence approaches (phase-based trauma therapy, EMDR, STAIR).",
    abstract:
      "Pilot RCT, N=42 with C-PTSD. Polyvagal-informed somatic therapy vs. waitlist. Results: ITQ scores fell by 31% in treatment vs 8% control (d=0.78). Limitations: small N, single site, no active comparator, preprint (not yet peer-reviewed).",
    authors: ["J. Reilly", "A. Becker"],
    journal: "medRxiv (preprint)",
    year: 2026,
    source: "medRxiv",
    sourceTone: "pink",
    evidenceKind: "preprint",
    url: "https://www.medrxiv.org/",
    topics: ["complex PTSD", "somatic", "polyvagal"],
    readingMinutes: 3,
    jargon: "medium",
    keyStats: [
      { label: "n", value: "42" },
      { label: "Cohen's d", value: "0.78" },
      { label: "Status", value: "Preprint" },
    ],
  },
];
