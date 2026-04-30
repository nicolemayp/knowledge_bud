/**
 * Knowledge Bud's curated topic catalog — used in the feed pills, the
 * Topics page, and the PubMed query map. Grouped so the UI can render
 * sections; flat list also exported for filter chips.
 */

export type TopicGroup =
  | "modality"
  | "neuroscience"
  | "clinical"
  | "diagnosis"
  | "population"
  | "wellness";

export type Topic = {
  id: string;
  label: string;
  emoji: string;
  group: TopicGroup;
  /** PubMed search term — used by the refresh fetcher. */
  pubmed: string;
};

export const TOPICS: Topic[] = [
  // ─── Modalities ────────────────────────────────────────────────
  { id: "cbt",            label: "CBT",                     emoji: "🧠", group: "modality",     pubmed: "(cognitive behavioral therapy[mh] OR CBT[tiab])" },
  { id: "dbt",            label: "DBT",                     emoji: "🌊", group: "modality",     pubmed: "dialectical behavior therapy[tiab] OR DBT[tiab]" },
  { id: "act",            label: "ACT",                     emoji: "🌿", group: "modality",     pubmed: "acceptance and commitment therapy[tiab] OR ACT[tiab]" },
  { id: "emdr",           label: "EMDR",                    emoji: "👁️", group: "modality",     pubmed: "EMDR[tiab] OR eye movement desensitization[tiab]" },
  { id: "ifs",            label: "IFS / parts",             emoji: "🪆", group: "modality",     pubmed: "internal family systems[tiab] OR parts therapy[tiab]" },
  { id: "schema",         label: "Schema therapy",          emoji: "🔁", group: "modality",     pubmed: "schema therapy[tiab]" },
  { id: "psychodynamic",  label: "Psychodynamic",           emoji: "🛋️", group: "modality",     pubmed: "psychodynamic therapy[tiab] OR psychoanalytic therapy[tiab]" },
  { id: "somatic",        label: "Somatic",                 emoji: "🌬️", group: "modality",     pubmed: "somatic experiencing[tiab] OR sensorimotor psychotherapy[tiab] OR body psychotherapy[tiab]" },
  { id: "polyvagal",      label: "Polyvagal",               emoji: "🧬", group: "modality",     pubmed: "polyvagal theory[tiab] OR vagal tone[tiab] OR autonomic regulation[tiab]" },
  { id: "music",          label: "Music therapy",           emoji: "🎶", group: "modality",     pubmed: "music therapy[mh] OR music therapy[tiab]" },
  { id: "art",            label: "Art therapy",             emoji: "🎨", group: "modality",     pubmed: "art therapy[mh] OR art therapy[tiab]" },
  { id: "play",           label: "Play therapy",            emoji: "🧸", group: "modality",     pubmed: "play therapy[tiab]" },
  { id: "narrative",      label: "Narrative therapy",       emoji: "📖", group: "modality",     pubmed: "narrative therapy[tiab]" },
  { id: "mi",             label: "Motivational interviewing", emoji: "🗣️", group: "modality",   pubmed: "motivational interviewing[tiab]" },
  { id: "cft",            label: "Compassion-focused (CFT)", emoji: "🤲", group: "modality",    pubmed: "compassion focused therapy[tiab] OR compassion-focused[tiab]" },
  { id: "mbsr",           label: "MBSR / mindfulness",      emoji: "🧘", group: "modality",     pubmed: "mindfulness[mh] OR MBSR[tiab] OR mindfulness based stress reduction[tiab]" },
  { id: "ecotherapy",     label: "Ecotherapy / nature",     emoji: "🌳", group: "modality",     pubmed: "ecotherapy[tiab] OR nature-based therapy[tiab] OR forest bathing[tiab]" },

  // ─── Applied neuroscience ─────────────────────────────────────
  { id: "attention",      label: "Attention & multitasking", emoji: "🎯", group: "neuroscience", pubmed: "task switching[tiab] OR multitasking[tiab] OR cognitive interference[tiab] OR attention[mh]" },
  { id: "working-memory", label: "Working memory",          emoji: "🧮", group: "neuroscience", pubmed: "working memory[mh] OR cognitive load[tiab]" },
  { id: "neuroplasticity", label: "Neuroplasticity",        emoji: "🌀", group: "neuroscience", pubmed: "neuronal plasticity[mh] OR neuroplasticity[tiab]" },
  { id: "default-mode",   label: "Default mode network",    emoji: "💭", group: "neuroscience", pubmed: "default mode network[tiab] OR DMN[tiab]" },
  { id: "stress",         label: "Stress & HPA axis",       emoji: "🌡️", group: "neuroscience", pubmed: "stress[mh] AND (HPA axis[tiab] OR cortisol[tiab] OR allostatic load[tiab])" },
  { id: "sleep",          label: "Sleep & memory",          emoji: "🌙", group: "neuroscience", pubmed: "sleep[mh] AND (memory consolidation[tiab] OR mental health[tiab] OR depression[tiab])" },
  { id: "interoception",  label: "Interoception",           emoji: "🫀", group: "neuroscience", pubmed: "interoception[tiab] OR interoceptive awareness[tiab]" },
  { id: "habit",          label: "Habit & behavior change", emoji: "🔂", group: "neuroscience", pubmed: "habit formation[tiab] OR behavior change[tiab]" },
  { id: "gut-brain",      label: "Brain–gut axis",          emoji: "🦠", group: "neuroscience", pubmed: "gut brain axis[tiab] OR microbiome[tiab] AND mental health[tiab]" },
  { id: "psychedelics",   label: "Psychedelics",            emoji: "🍄", group: "neuroscience", pubmed: "psilocybin[tiab] OR MDMA[tiab] OR ketamine[tiab] OR psychedelic[tiab]" },
  { id: "psychopharm",    label: "Psychopharm",             emoji: "💊", group: "neuroscience", pubmed: "psychopharmacology[tiab] OR antidepressant[tiab] OR SSRI[tiab]" },

  // ─── Clinical concepts ────────────────────────────────────────
  { id: "alliance",       label: "Therapeutic alliance",    emoji: "🤝", group: "clinical",     pubmed: "therapeutic alliance[tiab] OR working alliance[tiab]" },
  { id: "burnout",        label: "Therapist burnout",       emoji: "🕯️", group: "clinical",     pubmed: "burnout[mh] AND (therapist[tiab] OR clinician[tiab] OR vicarious trauma[tiab])" },
  { id: "trauma-informed", label: "Trauma-informed care",   emoji: "🌸", group: "clinical",     pubmed: "trauma informed care[tiab] OR trauma-informed[tiab]" },
  { id: "cultural-humility", label: "Cultural humility",    emoji: "🌍", group: "clinical",     pubmed: "cultural humility[tiab] OR multicultural competence[tiab] OR culturally responsive therapy[tiab]" },
  { id: "lgbtq",          label: "LGBTQ+ affirming",        emoji: "🏳️‍🌈", group: "clinical",     pubmed: "LGBTQ[tiab] OR affirmative therapy[tiab] OR sexual minority mental health[tiab]" },
  { id: "self-compassion", label: "Self-compassion",        emoji: "🌷", group: "clinical",     pubmed: "self compassion[tiab] OR self-compassion[tiab]" },
  { id: "attachment",     label: "Attachment",              emoji: "🪢", group: "clinical",     pubmed: "attachment theory[tiab] OR adult attachment[tiab] OR insecure attachment[tiab]" },

  // ─── Diagnoses ────────────────────────────────────────────────
  { id: "trauma",         label: "Trauma",                  emoji: "💗", group: "diagnosis",    pubmed: "trauma[tiab] OR psychological trauma[tiab]" },
  { id: "ptsd",           label: "PTSD",                    emoji: "🛡️", group: "diagnosis",    pubmed: "stress disorders, post-traumatic[mh] OR PTSD[tiab]" },
  { id: "complex-ptsd",   label: "Complex PTSD",            emoji: "🧷", group: "diagnosis",    pubmed: "complex PTSD[tiab] OR CPTSD[tiab]" },
  { id: "depression",     label: "Depression",              emoji: "🌧️", group: "diagnosis",    pubmed: "depressive disorder[mh] OR depression[tiab]" },
  { id: "anxiety",        label: "Anxiety",                 emoji: "🌀", group: "diagnosis",    pubmed: "anxiety disorders[mh] OR anxiety[tiab]" },
  { id: "ocd",            label: "OCD",                     emoji: "🔂", group: "diagnosis",    pubmed: "obsessive-compulsive disorder[mh] OR OCD[tiab]" },
  { id: "bipolar",        label: "Bipolar",                 emoji: "🌗", group: "diagnosis",    pubmed: "bipolar disorder[mh]" },
  { id: "bpd",            label: "BPD",                     emoji: "🪞", group: "diagnosis",    pubmed: "borderline personality disorder[mh] OR BPD[tiab]" },
  { id: "adhd",           label: "ADHD",                    emoji: "⚡", group: "diagnosis",     pubmed: "attention deficit disorder with hyperactivity[mh] OR ADHD[tiab]" },
  { id: "autism",         label: "Autism",                  emoji: "🧩", group: "diagnosis",    pubmed: "autism spectrum disorder[mh] OR autistic[tiab]" },
  { id: "eating",         label: "Eating disorders",        emoji: "🍽️", group: "diagnosis",    pubmed: "feeding and eating disorders[mh] OR eating disorder[tiab]" },
  { id: "addiction",      label: "Addiction",               emoji: "🔓", group: "diagnosis",    pubmed: "substance-related disorders[mh] OR addiction[tiab]" },
  { id: "suicide",        label: "Suicide prevention",      emoji: "🆘", group: "diagnosis",    pubmed: "suicide[mh] AND (prevention[tiab] OR ideation[tiab])" },
  { id: "grief",          label: "Grief & bereavement",     emoji: "🕊️", group: "diagnosis",    pubmed: "grief[tiab] OR bereavement[mh] OR prolonged grief[tiab]" },

  // ─── Populations ──────────────────────────────────────────────
  { id: "adolescent",     label: "Adolescent",              emoji: "🌱", group: "population",   pubmed: "adolescent[mh] AND (mental health[tiab] OR psychiatric[tiab])" },
  { id: "child",          label: "Child",                   emoji: "🧒", group: "population",   pubmed: "child[mh] AND (mental health[tiab] OR psychiatric[tiab])" },
  { id: "family",         label: "Family systems",          emoji: "🏠", group: "population",   pubmed: "family therapy[mh] OR family systems[tiab]" },
  { id: "couples",        label: "Couples",                 emoji: "💞", group: "population",   pubmed: "couples therapy[tiab] OR marital therapy[tiab] OR EFT couples[tiab]" },
  { id: "perinatal",      label: "Perinatal",               emoji: "🤱", group: "population",   pubmed: "postpartum[tiab] OR perinatal[tiab] AND (depression OR anxiety)" },
  { id: "elderly",        label: "Elderly",                 emoji: "👵", group: "population",   pubmed: "aged[mh] AND (depression OR anxiety OR dementia)" },
  { id: "veterans",       label: "Veterans",                emoji: "🎖️", group: "population",   pubmed: "veterans[mh] AND (PTSD OR mental health)" },
  { id: "first-responders", label: "First responders",      emoji: "🚑", group: "population",   pubmed: "(first responder[tiab] OR police officer[tiab] OR firefighter[tiab]) AND (PTSD OR mental health)" },
  { id: "neurodiversity", label: "Neurodiversity",          emoji: "🌈", group: "population",   pubmed: "neurodiversity[tiab] OR neurodivergent[tiab]" },

  // ─── Wellness / lifestyle (clinical) ──────────────────────────
  { id: "loneliness",     label: "Loneliness",              emoji: "🌫️", group: "wellness",     pubmed: "loneliness[tiab] OR social isolation[mh]" },
  { id: "social-conn",    label: "Social connection",       emoji: "🫶", group: "wellness",     pubmed: "social connection[tiab] OR social support[mh]" },
  { id: "exercise",       label: "Exercise & mood",         emoji: "🏃", group: "wellness",     pubmed: "exercise[mh] AND (depression OR anxiety OR mental health)" },
];

export const TOPIC_GROUPS: { id: TopicGroup; label: string; emoji: string }[] = [
  { id: "modality",     label: "Modalities",                emoji: "🌷" },
  { id: "neuroscience", label: "Applied neuroscience",      emoji: "🧬" },
  { id: "clinical",     label: "Clinical concepts",         emoji: "💡" },
  { id: "diagnosis",    label: "Diagnoses",                 emoji: "🩺" },
  { id: "population",   label: "Populations",               emoji: "🌱" },
  { id: "wellness",     label: "Wellness & lifestyle",      emoji: "🌙" },
];

/** Build the PubMed topic→query map from the catalog. */
export const PUBMED_TOPIC_QUERY: Record<string, string> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t.pubmed])
);
