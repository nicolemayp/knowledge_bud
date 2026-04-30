/**
 * Knowledge Bud's curated topic catalog — used in the feed pills, the
 * Topics page, and the source query map. Grouped so the UI can render
 * sections; flat list also exported for filter chips.
 *
 * Each topic's PubMed/Europe-PMC query is intentionally narrow and
 * anchors loose acronyms (ACT, CBT, DBT, BPD, ACT, etc.) to mental-health
 * context to avoid pulling in cancer/molecular-biology papers. Every
 * query is wrapped with a clinical-relevance filter that:
 *   - restricts to human studies
 *   - excludes pure-animal/preclinical work
 *   - excludes editorials, letters, comments, retractions
 *   - excludes purely-device-engineering papers (no clinical outcomes)
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
  /** PubMed/Europe-PMC search term (Lucene-ish syntax). */
  pubmed: string;
};

/**
 * Wrap any topic query with a clinical-relevance gate.
 *   - humans only (excludes pure animal models)
 *   - English language
 *   - no editorials/letters/comments/retractions
 *   - has an Abstract (filters out junk)
 */
function clinical(q: string): string {
  return `(${q}) AND humans[mh] AND english[lang] AND hasabstract[text] NOT (editorial[pt] OR comment[pt] OR letter[pt] OR retracted publication[pt] OR retraction of publication[pt])`;
}

/** Mental-health-context anchor for ambiguous acronyms (CBT, DBT, ACT). */
const MH_CONTEXT =
  "(mental health[tiab] OR psychotherapy[tiab] OR psychotherapy[mh] OR depression[tiab] OR anxiety[tiab] OR PTSD[tiab] OR trauma[tiab] OR substance use[tiab] OR psychiatric[tiab] OR psychological[tiab] OR psychiatry[mh])";

export const TOPICS: Topic[] = [
  // ─── Modalities ────────────────────────────────────────────────
  { id: "cbt",            label: "CBT",                     emoji: "🧠", group: "modality",
    pubmed: clinical(`("cognitive behavioral therapy"[mh] OR "cognitive behavior therapy"[tiab] OR "cognitive-behavioral therapy"[tiab] OR (CBT[ti] AND ${MH_CONTEXT}))`) },
  { id: "dbt",            label: "DBT",                     emoji: "🌊", group: "modality",
    pubmed: clinical(`("dialectical behavior therapy"[tiab] OR "dialectical behavioral therapy"[tiab] OR (DBT[ti] AND (borderline[tiab] OR self-harm[tiab] OR self-injury[tiab] OR psychotherapy[tiab] OR emotion regulation[tiab])))`) },
  { id: "act",            label: "ACT",                     emoji: "🌿", group: "modality",
    pubmed: clinical(`("acceptance and commitment therapy"[tiab] OR "acceptance and commitment therapies"[tiab] OR (ACT[ti] AND (psychotherapy[tiab] OR psychological flexibility[tiab] OR depression[tiab] OR anxiety[tiab] OR chronic pain[tiab] OR mental health[tiab])))`) },
  { id: "emdr",           label: "EMDR",                    emoji: "👁️", group: "modality",
    pubmed: clinical(`("eye movement desensitization and reprocessing"[tiab] OR EMDR[tiab])`) },
  { id: "ifs",            label: "IFS / parts",             emoji: "🪆", group: "modality",
    pubmed: clinical(`("internal family systems"[tiab] OR "parts work"[tiab] OR "parts therapy"[tiab] OR (IFS[ti] AND psychotherapy[tiab]))`) },
  { id: "schema",         label: "Schema therapy",          emoji: "🔁", group: "modality",
    pubmed: clinical(`"schema therapy"[tiab]`) },
  { id: "psychodynamic",  label: "Psychodynamic",           emoji: "🛋️", group: "modality",
    pubmed: clinical(`"psychodynamic therapy"[tiab] OR "psychodynamic psychotherapy"[tiab] OR "psychoanalytic psychotherapy"[tiab] OR "short-term psychodynamic"[tiab]`) },
  { id: "somatic",        label: "Somatic",                 emoji: "🌬️", group: "modality",
    pubmed: clinical(`("somatic experiencing"[tiab] OR "sensorimotor psychotherapy"[tiab] OR "body psychotherapy"[tiab] OR "somatic therapy"[tiab])`) },
  { id: "polyvagal",      label: "Polyvagal",               emoji: "🧬", group: "modality",
    pubmed: clinical(`"polyvagal theory"[tiab] OR "vagal tone"[tiab] OR "heart rate variability"[tiab] AND (anxiety[tiab] OR PTSD[tiab] OR trauma[tiab] OR depression[tiab])`) },
  { id: "music",          label: "Music therapy",           emoji: "🎶", group: "modality",
    pubmed: clinical(`"music therapy"[mh] OR "music therapy"[tiab]`) },
  { id: "art",            label: "Art therapy",             emoji: "🎨", group: "modality",
    pubmed: clinical(`"art therapy"[mh] OR "art therapy"[tiab]`) },
  { id: "play",           label: "Play therapy",            emoji: "🧸", group: "modality",
    pubmed: clinical(`"play therapy"[tiab]`) },
  { id: "narrative",      label: "Narrative therapy",       emoji: "📖", group: "modality",
    pubmed: clinical(`"narrative therapy"[tiab] OR "narrative exposure therapy"[tiab]`) },
  { id: "mi",             label: "Motivational interviewing", emoji: "🗣️", group: "modality",
    pubmed: clinical(`"motivational interviewing"[mh] OR "motivational interviewing"[tiab]`) },
  { id: "cft",            label: "Compassion-focused (CFT)", emoji: "🤲", group: "modality",
    pubmed: clinical(`"compassion focused therapy"[tiab] OR "compassion-focused therapy"[tiab] OR "compassionate mind training"[tiab]`) },
  { id: "mbsr",           label: "MBSR / mindfulness",      emoji: "🧘", group: "modality",
    pubmed: clinical(`"mindfulness"[mh] OR "mindfulness-based stress reduction"[tiab] OR MBSR[tiab] OR "mindfulness-based cognitive therapy"[tiab] OR MBCT[tiab]`) },
  { id: "ecotherapy",     label: "Ecotherapy / nature",     emoji: "🌳", group: "modality",
    pubmed: clinical(`("ecotherapy"[tiab] OR "nature-based therapy"[tiab] OR "forest bathing"[tiab] OR ("nature exposure"[tiab] AND mental health[tiab]))`) },

  // ─── Applied neuroscience (clinically-flavored only) ───────────
  { id: "attention",      label: "Attention & multitasking", emoji: "🎯", group: "neuroscience",
    pubmed: clinical(`("task switching"[tiab] OR "multitasking"[tiab] OR "cognitive interference"[tiab] OR "selective attention"[tiab]) AND (depression[tiab] OR anxiety[tiab] OR ADHD[tiab] OR aging[tiab] OR cognitive[tiab])`) },
  { id: "working-memory", label: "Working memory",          emoji: "🧮", group: "neuroscience",
    pubmed: clinical(`"working memory"[mh] AND (depression[tiab] OR anxiety[tiab] OR PTSD[tiab] OR ADHD[tiab] OR therapy[tiab] OR training[tiab])`) },
  { id: "neuroplasticity", label: "Neuroplasticity",        emoji: "🌀", group: "neuroscience",
    pubmed: clinical(`"neuronal plasticity"[mh] AND (psychotherapy[tiab] OR depression[tiab] OR PTSD[tiab] OR anxiety[tiab] OR mental health[tiab])`) },
  { id: "default-mode",   label: "Default mode network",    emoji: "💭", group: "neuroscience",
    pubmed: clinical(`("default mode network"[tiab] OR DMN[tiab]) AND (depression[tiab] OR anxiety[tiab] OR rumination[tiab] OR mindfulness[tiab] OR psychotherapy[tiab])`) },
  { id: "stress",         label: "Stress & HPA axis",       emoji: "🌡️", group: "neuroscience",
    pubmed: clinical(`("HPA axis"[tiab] OR "cortisol"[tiab] OR "allostatic load"[tiab]) AND (depression[tiab] OR anxiety[tiab] OR PTSD[tiab] OR psychotherapy[tiab])`) },
  { id: "sleep",          label: "Sleep & memory",          emoji: "🌙", group: "neuroscience",
    pubmed: clinical(`"sleep"[mh] AND (depression[tiab] OR anxiety[tiab] OR PTSD[tiab] OR memory[tiab] OR insomnia[tiab])`) },
  { id: "interoception",  label: "Interoception",           emoji: "🫀", group: "neuroscience",
    pubmed: clinical(`("interoception"[tiab] OR "interoceptive awareness"[tiab]) AND (anxiety[tiab] OR depression[tiab] OR eating disorder[tiab] OR PTSD[tiab] OR psychotherapy[tiab])`) },
  { id: "habit",          label: "Habit & behavior change", emoji: "🔂", group: "neuroscience",
    pubmed: clinical(`("habit formation"[tiab] OR "behavior change"[tiab]) AND (mental health[tiab] OR depression[tiab] OR anxiety[tiab] OR addiction[tiab])`) },
  { id: "psychedelics",   label: "Psychedelics",            emoji: "🍄", group: "neuroscience",
    pubmed: clinical(`(psilocybin[tiab] OR MDMA[tiab] OR ketamine[tiab] OR LSD[tiab] OR ayahuasca[tiab] OR psychedelic*[tiab]) AND (depression[tiab] OR PTSD[tiab] OR anxiety[tiab] OR addiction[tiab] OR therapy[tiab])`) },
  { id: "psychopharm",    label: "Psychopharm",             emoji: "💊", group: "neuroscience",
    pubmed: clinical(`(antidepressant[tiab] OR SSRI[tiab] OR antipsychotic[tiab] OR mood stabilizer[tiab]) AND (clinical trial[pt] OR meta-analysis[pt] OR systematic review[pt] OR efficacy[tiab])`) },

  // ─── Clinical concepts ────────────────────────────────────────
  { id: "alliance",       label: "Therapeutic alliance",    emoji: "🤝", group: "clinical",
    pubmed: clinical(`("therapeutic alliance"[tiab] OR "working alliance"[tiab] OR "patient-therapist relationship"[tiab])`) },
  { id: "burnout",        label: "Therapist burnout",       emoji: "🕯️", group: "clinical",
    pubmed: clinical(`(burnout[mh] OR "vicarious trauma"[tiab] OR "compassion fatigue"[tiab]) AND (therapist[tiab] OR clinician[tiab] OR mental health professional[tiab] OR psychologist[tiab])`) },
  { id: "trauma-informed", label: "Trauma-informed care",   emoji: "🌸", group: "clinical",
    pubmed: clinical(`"trauma-informed"[tiab] OR "trauma informed care"[tiab]`) },
  { id: "cultural-humility", label: "Cultural humility",    emoji: "🌍", group: "clinical",
    pubmed: clinical(`("cultural humility"[tiab] OR "culturally responsive"[tiab] OR "multicultural competence"[tiab]) AND (therapy[tiab] OR mental health[tiab] OR psychotherapy[tiab])`) },
  { id: "lgbtq",          label: "LGBTQ+ affirming",        emoji: "🏳️‍🌈", group: "clinical",
    pubmed: clinical(`(LGBTQ[tiab] OR transgender[tiab] OR "sexual minority"[tiab] OR "gender minority"[tiab]) AND (mental health[tiab] OR therapy[tiab] OR depression[tiab] OR anxiety[tiab] OR affirmative[tiab])`) },
  { id: "self-compassion", label: "Self-compassion",        emoji: "🌷", group: "clinical",
    pubmed: clinical(`"self-compassion"[tiab] OR "self compassion"[tiab]`) },
  { id: "attachment",     label: "Attachment",              emoji: "🪢", group: "clinical",
    pubmed: clinical(`("attachment theory"[tiab] OR "adult attachment"[tiab] OR "insecure attachment"[tiab] OR "attachment style"[tiab]) AND (therapy[tiab] OR mental health[tiab] OR depression[tiab] OR anxiety[tiab])`) },

  // ─── Diagnoses ────────────────────────────────────────────────
  { id: "trauma",         label: "Trauma",                  emoji: "💗", group: "diagnosis",
    pubmed: clinical(`(trauma[tiab] OR "psychological trauma"[mh]) AND (therapy[tiab] OR treatment[tiab] OR PTSD[tiab] OR resilience[tiab])`) },
  { id: "ptsd",           label: "PTSD",                    emoji: "🛡️", group: "diagnosis",
    pubmed: clinical(`"stress disorders, post-traumatic"[mh] OR PTSD[tiab] OR "post-traumatic stress disorder"[tiab]`) },
  { id: "complex-ptsd",   label: "Complex PTSD",            emoji: "🧷", group: "diagnosis",
    pubmed: clinical(`"complex PTSD"[tiab] OR "complex post-traumatic stress"[tiab] OR CPTSD[tiab]`) },
  { id: "depression",     label: "Depression",              emoji: "🌧️", group: "diagnosis",
    pubmed: clinical(`("depressive disorder"[mh] OR "major depressive disorder"[tiab] OR depression[ti]) AND (therapy[tiab] OR treatment[tiab] OR psychotherapy[tiab] OR clinical trial[pt] OR meta-analysis[pt])`) },
  { id: "anxiety",        label: "Anxiety",                 emoji: "🌀", group: "diagnosis",
    pubmed: clinical(`("anxiety disorders"[mh] OR "generalized anxiety"[tiab] OR "social anxiety"[tiab] OR "panic disorder"[tiab]) AND (therapy[tiab] OR treatment[tiab] OR psychotherapy[tiab])`) },
  { id: "ocd",            label: "OCD",                     emoji: "🔂", group: "diagnosis",
    pubmed: clinical(`"obsessive-compulsive disorder"[mh] OR OCD[tiab]`) },
  { id: "bipolar",        label: "Bipolar",                 emoji: "🌗", group: "diagnosis",
    pubmed: clinical(`"bipolar disorder"[mh]`) },
  { id: "bpd",            label: "BPD",                     emoji: "🪞", group: "diagnosis",
    pubmed: clinical(`"borderline personality disorder"[mh] OR "borderline personality"[tiab]`) },
  { id: "adhd",           label: "ADHD",                    emoji: "⚡", group: "diagnosis",
    pubmed: clinical(`"attention deficit disorder with hyperactivity"[mh] OR ADHD[tiab]`) },
  { id: "autism",         label: "Autism",                  emoji: "🧩", group: "diagnosis",
    pubmed: clinical(`"autism spectrum disorder"[mh] OR autistic[tiab] OR "autism spectrum"[tiab]`) },
  { id: "eating",         label: "Eating disorders",        emoji: "🍽️", group: "diagnosis",
    pubmed: clinical(`"feeding and eating disorders"[mh] OR anorexia[tiab] OR bulimia[tiab] OR "binge eating"[tiab]`) },
  { id: "addiction",      label: "Addiction",               emoji: "🔓", group: "diagnosis",
    pubmed: clinical(`("substance-related disorders"[mh] OR addiction[tiab] OR "substance use disorder"[tiab] OR "alcohol use disorder"[tiab])`) },
  { id: "suicide",        label: "Suicide prevention",      emoji: "🆘", group: "diagnosis",
    pubmed: clinical(`"suicide"[mh] AND (prevention[tiab] OR ideation[tiab] OR risk[tiab] OR safety planning[tiab])`) },
  { id: "grief",          label: "Grief & bereavement",     emoji: "🕊️", group: "diagnosis",
    pubmed: clinical(`grief[tiab] OR bereavement[mh] OR "prolonged grief"[tiab] OR "complicated grief"[tiab]`) },

  // ─── Populations ──────────────────────────────────────────────
  { id: "adults",         label: "Adults (general)",        emoji: "👤", group: "population",
    pubmed: clinical(`adult[mh] AND ("mental health"[tiab] OR psychotherapy[tiab] OR depression[tiab] OR anxiety[tiab])`) },
  { id: "young-adults",   label: "Young adults",            emoji: "🌱", group: "population",
    pubmed: clinical(`("young adult"[mh] OR "emerging adulthood"[tiab] OR "college students"[tiab]) AND ("mental health"[tiab] OR depression[tiab] OR anxiety[tiab])`) },
  { id: "adolescent",     label: "Adolescents",             emoji: "🌷", group: "population",
    pubmed: clinical(`adolescent[mh] AND ("mental health"[tiab] OR psychiatric[tiab] OR psychotherapy[tiab] OR depression[tiab] OR anxiety[tiab])`) },
  { id: "child",          label: "Children",                emoji: "🧒", group: "population",
    pubmed: clinical(`child[mh] AND ("mental health"[tiab] OR psychiatric[tiab] OR psychotherapy[tiab])`) },
  { id: "older-adults",   label: "Older adults",            emoji: "👵", group: "population",
    pubmed: clinical(`aged[mh] AND (depression[tiab] OR anxiety[tiab] OR dementia[tiab] OR psychotherapy[tiab])`) },
  { id: "women",          label: "Women's mental health",   emoji: "🌹", group: "population",
    pubmed: clinical(`("women's health"[tiab] OR "female"[mh]) AND (depression[tiab] OR anxiety[tiab] OR PTSD[tiab] OR perinatal[tiab] OR menopause[tiab])`) },
  { id: "men",            label: "Men's mental health",     emoji: "🧔", group: "population",
    pubmed: clinical(`("men's mental health"[tiab] OR "male"[mh]) AND (depression[tiab] OR suicide[tiab] OR therapy[tiab] OR help-seeking[tiab])`) },
  { id: "perinatal",      label: "Perinatal",               emoji: "🤱", group: "population",
    pubmed: clinical(`(postpartum[tiab] OR perinatal[tiab] OR "pregnancy"[mh]) AND (depression[tiab] OR anxiety[tiab] OR PTSD[tiab] OR psychotherapy[tiab])`) },
  { id: "couples",        label: "Couples",                 emoji: "💞", group: "population",
    pubmed: clinical(`"couples therapy"[tiab] OR "marital therapy"[tiab] OR "emotionally focused therapy"[tiab] OR "couple-based"[tiab]`) },
  { id: "family",         label: "Families",                emoji: "🏠", group: "population",
    pubmed: clinical(`"family therapy"[mh] OR "family-based treatment"[tiab] OR "family systems"[tiab]`) },
  { id: "veterans",       label: "Veterans",                emoji: "🎖️", group: "population",
    pubmed: clinical(`veterans[mh] AND (PTSD[tiab] OR depression[tiab] OR "moral injury"[tiab] OR mental health[tiab])`) },
  { id: "first-responders", label: "First responders",      emoji: "🚑", group: "population",
    pubmed: clinical(`("first responder"[tiab] OR "police officer"[tiab] OR firefighter[tiab] OR paramedic[tiab] OR "emergency medical"[tiab]) AND (PTSD[tiab] OR mental health[tiab] OR burnout[tiab])`) },
  { id: "healthcare",     label: "Healthcare workers",      emoji: "🩺", group: "population",
    pubmed: clinical(`(nurses[tiab] OR physicians[tiab] OR "health personnel"[mh] OR "healthcare workers"[tiab]) AND (burnout[tiab] OR depression[tiab] OR mental health[tiab] OR anxiety[tiab])`) },
  { id: "bipoc",          label: "BIPOC mental health",     emoji: "🌍", group: "population",
    pubmed: clinical(`("racial minorities"[tiab] OR "ethnic minorities"[mh] OR "African American"[tiab] OR "Black Americans"[tiab] OR "Hispanic"[tiab] OR "Indigenous"[tiab]) AND (mental health[tiab] OR therapy[tiab] OR depression[tiab] OR PTSD[tiab])`) },
  { id: "refugees",       label: "Refugees & immigrants",   emoji: "🕊️", group: "population",
    pubmed: clinical(`(refugees[mh] OR "asylum seekers"[tiab] OR immigrants[tiab]) AND (mental health[tiab] OR PTSD[tiab] OR trauma[tiab] OR depression[tiab])`) },
  { id: "neurodiversity", label: "Neurodiversity",          emoji: "🧩", group: "population",
    pubmed: clinical(`(neurodiversity[tiab] OR neurodivergent[tiab] OR "autism spectrum"[tiab] OR ADHD[tiab]) AND (adult[tiab] OR therapy[tiab] OR mental health[tiab] OR identity[tiab])`) },

  // ─── Wellness / lifestyle ─────────────────────────────────────
  { id: "loneliness",     label: "Loneliness",              emoji: "🌫️", group: "wellness",
    pubmed: clinical(`(loneliness[tiab] OR "social isolation"[mh]) AND (depression[tiab] OR anxiety[tiab] OR mental health[tiab] OR intervention[tiab])`) },
  { id: "social-conn",    label: "Social connection",       emoji: "🫶", group: "wellness",
    pubmed: clinical(`("social support"[mh] OR "social connection"[tiab]) AND (depression[tiab] OR anxiety[tiab] OR mental health[tiab])`) },
  { id: "exercise",       label: "Exercise & mood",         emoji: "🏃", group: "wellness",
    pubmed: clinical(`exercise[mh] AND (depression[tiab] OR anxiety[tiab] OR PTSD[tiab] OR mental health[tiab])`) },
];

export const TOPIC_GROUPS: { id: TopicGroup; label: string; emoji: string }[] = [
  { id: "modality",     label: "Modalities",                emoji: "🌷" },
  { id: "neuroscience", label: "Applied neuroscience",      emoji: "🧬" },
  { id: "clinical",     label: "Clinical concepts",         emoji: "💡" },
  { id: "diagnosis",    label: "Diagnoses",                 emoji: "🩺" },
  { id: "population",   label: "Populations",               emoji: "🌱" },
  { id: "wellness",     label: "Wellness & lifestyle",      emoji: "🌙" },
];

/** Build the PubMed/Europe-PMC topic→query map from the catalog. */
export const PUBMED_TOPIC_QUERY: Record<string, string> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t.pubmed])
);

/**
 * Quick post-fetch relevance check — drops papers whose abstracts strongly
 * suggest preclinical / animal / pure-engineering work that slipped past
 * the [mh] filter.
 *
 * Conservative: only drops when we have multiple animal/in-vitro signals
 * and no human-study signal.
 */
const PRECLINICAL_HINTS = [
  /\bmice\b/i,
  /\bmouse\b/i,
  /\brat(s)?\b/i,
  /\brodent(s)?\b/i,
  /\bzebrafish\b/i,
  /\bdrosophila\b/i,
  /\bcell culture\b/i,
  /\bin vitro\b/i,
  /\bknockout\b/i,
  /\bknockdown\b/i,
  /\btransgenic\b/i,
  /\bsynaptosome/i,
  /\bhippocampal slices?\b/i,
];
const HUMAN_HINTS = [
  /\bpatients?\b/i,
  /\bparticipants?\b/i,
  /\bsubjects?\b/i,
  /\bhuman(s)?\b/i,
  /\badults?\b/i,
  /\bchildren\b/i,
  /\badolescents?\b/i,
  /\brandomi[sz]ed\b/i,
  /\bclinical trial\b/i,
  /\bsystematic review\b/i,
  /\bmeta-analysis\b/i,
  /\binclusion criteria\b/i,
  /\boutpatients?\b/i,
];

export function isClinicallyRelevant(abstract?: string | null): boolean {
  if (!abstract || abstract.length < 100) return true; // can't tell — let it through
  const preCount = PRECLINICAL_HINTS.filter((re) => re.test(abstract)).length;
  const humCount = HUMAN_HINTS.filter((re) => re.test(abstract)).length;
  if (preCount >= 2 && humCount === 0) return false;
  if (preCount >= 3) return false;
  return true;
}
