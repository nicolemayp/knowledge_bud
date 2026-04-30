/**
 * Curated mental-health research glossary.
 * Used by the tap-to-define tooltip in the Feed.
 * Seeded into the `glossary` table on first DB connection.
 */
export const GLOSSARY_SEED: { term: string; definition: string; category?: string }[] = [
  { term: "RCT", definition: "Randomized controlled trial — participants are randomly assigned to treatment or control. Considered the gold standard for testing whether an intervention causes an outcome.", category: "study-design" },
  { term: "meta-analysis", definition: "A statistical synthesis of results from multiple studies on the same question. Sits at the top of the evidence pyramid because it pools effects across many trials.", category: "study-design" },
  { term: "cohort study", definition: "A longitudinal observational study that follows a group over time and compares outcomes. Cannot prove causation but can identify strong associations.", category: "study-design" },
  { term: "case study", definition: "An in-depth report on one or a few individuals. Hypothesis-generating, not proof.", category: "study-design" },
  { term: "preprint", definition: "A research manuscript shared publicly before peer review. Useful for early access but read with caution — findings may change after review.", category: "publishing" },
  { term: "p-value", definition: "Probability of seeing the observed result (or more extreme) if there were no real effect. Lower = stronger evidence against 'no effect.' Convention: <0.05 is 'statistically significant,' but it doesn't measure size of effect.", category: "stats" },
  { term: "effect size", definition: "How big the difference is, independent of sample size. Common forms: Cohen's d (small ~0.2, medium ~0.5, large ~0.8), risk ratio (RR), odds ratio (OR).", category: "stats" },
  { term: "Cohen's d", definition: "An effect size for the difference between two means, in standard-deviation units. ~0.2 small, ~0.5 medium, ~0.8 large.", category: "stats" },
  { term: "confidence interval", definition: "A range of plausible values for the true effect. A 95% CI means: if we repeated the study many times, ~95% of these intervals would contain the true value.", category: "stats" },
  { term: "intent-to-treat", definition: "Analyzing all participants in the group they were randomized to, even if they dropped out or didn't comply. Preserves the benefit of randomization.", category: "stats" },
  { term: "CBT", definition: "Cognitive Behavioral Therapy — structured short-term therapy targeting thoughts, behaviors, and emotions. Strong evidence base for depression, anxiety, OCD, and more.", category: "modality" },
  { term: "DBT", definition: "Dialectical Behavior Therapy — combines CBT with mindfulness and acceptance. Originally developed for borderline personality disorder; effective for self-harm and emotion dysregulation.", category: "modality" },
  { term: "EMDR", definition: "Eye Movement Desensitization and Reprocessing — a trauma-focused therapy using bilateral stimulation. Evidence supports its use for PTSD; mechanism is debated.", category: "modality" },
  { term: "ACT", definition: "Acceptance and Commitment Therapy — third-wave CBT focused on psychological flexibility, defusion from thoughts, and values-based action.", category: "modality" },
  { term: "psychodynamic", definition: "Therapy emphasizing unconscious processes, early relationships, and insight. Modern brief psychodynamic therapies have growing evidence for depression and personality disorders.", category: "modality" },
  { term: "polyvagal theory", definition: "A theory by Stephen Porges proposing that the vagus nerve regulates social engagement and threat response. Influential clinically; some empirical claims are contested.", category: "theory" },
  { term: "PTSD", definition: "Post-Traumatic Stress Disorder — a condition following exposure to a traumatic event, with intrusive memories, avoidance, hyperarousal, and mood/cognitive changes.", category: "diagnosis" },
  { term: "Complex PTSD", definition: "Now in ICD-11. Includes core PTSD plus disturbances in self-organization (DSO): emotion regulation, self-concept, and relationships, often after prolonged trauma.", category: "diagnosis" },
  { term: "BPD", definition: "Borderline Personality Disorder — characterized by emotional instability, identity disturbance, and difficulties in relationships. Treatable; DBT and MBT have strong evidence.", category: "diagnosis" },
  { term: "MBT", definition: "Mentalization-Based Treatment — therapy that builds the capacity to understand mental states (own and others'). Effective for BPD.", category: "modality" },
  { term: "PCL-5", definition: "PTSD Checklist for DSM-5 — a 20-item self-report scale, score range 0–80. Higher = more PTSD symptoms.", category: "measure" },
  { term: "PHQ-9", definition: "Patient Health Questionnaire-9 — a brief depression screener (score 0–27). 5/10/15/20 = mild/moderate/moderately severe/severe.", category: "measure" },
  { term: "GAD-7", definition: "Generalized Anxiety Disorder 7-item scale (score 0–21). 5/10/15 = mild/moderate/severe.", category: "measure" },
  { term: "ITQ", definition: "International Trauma Questionnaire — measures ICD-11 PTSD and Complex PTSD.", category: "measure" },
  { term: "rumination", definition: "Repetitive, passive focus on negative feelings and their causes/consequences. Strong predictor of depression onset and maintenance.", category: "construct" },
  { term: "psychoneuroimmunology", definition: "Field studying interactions between psychological processes, the nervous system, and immune function — e.g. how chronic stress raises inflammation.", category: "field" },
  { term: "inflammation marker", definition: "Blood proteins (CRP, IL-6, TNF-α) that rise during inflammation. Chronically elevated levels are linked to depression, anxiety, and physical disease.", category: "biology" },
  { term: "psychedelic-assisted therapy", definition: "Therapy using psilocybin, MDMA, or ketamine alongside structured psychological support. Promising evidence for treatment-resistant conditions; still being validated.", category: "modality" },
];
