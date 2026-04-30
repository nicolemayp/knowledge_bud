/**
 * Source registry — all external research sources.
 * Each source has metadata + (eventually) a fetcher.
 *
 * v0: only PubMed has a real fetcher; others are stubbed and surfaced
 *     in the UI with their limits + manual refresh button.
 */

export type RateLimit =
  | { kind: "perSecond"; n: number; note?: string }
  | { kind: "perDay"; n: number; note?: string }
  | { kind: "perMonth"; n: number; note?: string }
  | { kind: "soft"; note: string };

export type SourceConfig = {
  slug: string;
  name: string;
  description: string;
  homepage: string;
  apiBase?: string;
  needsKey: boolean;
  /** Friendly limits to show in the UI */
  limits: RateLimit[];
  reliability: "peer-reviewed" | "preprint" | "institutional" | "directory";
  toneClass: "pink" | "lavender" | "babyblue" | "neutral";
};

export const SOURCES: SourceConfig[] = [
  {
    slug: "pubmed",
    name: "PubMed",
    description:
      "NIH/NLM's index of peer-reviewed biomedical literature — the gold standard for psychiatry & psychology.",
    homepage: "https://pubmed.ncbi.nlm.nih.gov/",
    apiBase: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils",
    needsKey: false, // optional but recommended
    limits: [
      { kind: "perSecond", n: 3, note: "Without API key" },
      { kind: "perSecond", n: 10, note: "With free API key (NCBI)" },
    ],
    reliability: "peer-reviewed",
    toneClass: "babyblue",
  },
  {
    slug: "europepmc",
    name: "Europe PMC",
    description:
      "Mirror of PubMed plus full-text and preprints. Great for accessing the actual paper text.",
    homepage: "https://europepmc.org/",
    apiBase: "https://www.ebi.ac.uk/europepmc/webservices/rest",
    needsKey: false,
    limits: [{ kind: "soft", note: "Be reasonable (~10 req/s)" }],
    reliability: "peer-reviewed",
    toneClass: "lavender",
  },
  {
    slug: "semanticscholar",
    name: "Semantic Scholar",
    description:
      "AI-tagged metadata for scholarly papers — but Knowledge Bud only uses verified fields, never AI-generated TLDRs.",
    homepage: "https://www.semanticscholar.org/",
    apiBase: "https://api.semanticscholar.org/graph/v1",
    needsKey: false,
    limits: [
      { kind: "soft", note: "100 req / 5 min unauthenticated" },
      { kind: "perSecond", n: 1, note: "With free key" },
    ],
    reliability: "peer-reviewed",
    toneClass: "lavender",
  },
  {
    slug: "openalex",
    name: "OpenAlex",
    description:
      "The largest free open scholarly graph. Great for broad topic filtering and discovering connected work.",
    homepage: "https://openalex.org/",
    apiBase: "https://api.openalex.org",
    needsKey: false,
    limits: [{ kind: "perDay", n: 100000, note: "Polite pool with email" }],
    reliability: "peer-reviewed",
    toneClass: "babyblue",
  },
  {
    slug: "medrxiv",
    name: "medRxiv",
    description: "Health-sciences preprints — the latest findings, before peer review.",
    homepage: "https://www.medrxiv.org/",
    apiBase: "https://api.biorxiv.org/details/medrxiv",
    needsKey: false,
    limits: [{ kind: "soft", note: "Be reasonable" }],
    reliability: "preprint",
    toneClass: "pink",
  },
  {
    slug: "plos",
    name: "PLOS",
    description: "Open-access journals (PLOS ONE, PLOS Medicine, etc.) with full-text articles.",
    homepage: "https://plos.org/",
    apiBase: "https://api.plos.org/search",
    needsKey: false,
    limits: [{ kind: "perDay", n: 7200 }],
    reliability: "peer-reviewed",
    toneClass: "lavender",
  },
  {
    slug: "doaj",
    name: "DOAJ",
    description: "Directory of Open Access Journals — index of legitimate open-access publications.",
    homepage: "https://doaj.org/",
    apiBase: "https://doaj.org/api/v2",
    needsKey: false,
    limits: [{ kind: "soft", note: "Be reasonable" }],
    reliability: "directory",
    toneClass: "neutral",
  },
  {
    slug: "crossref",
    name: "Crossref",
    description: "DOI metadata + citation links. Powers our 'verified citations' feature.",
    homepage: "https://www.crossref.org/",
    apiBase: "https://api.crossref.org",
    needsKey: false,
    limits: [{ kind: "perSecond", n: 50, note: "Polite pool" }],
    reliability: "directory",
    toneClass: "babyblue",
  },
  {
    slug: "nimh",
    name: "NIMH",
    description: "U.S. National Institute of Mental Health — official news & science updates.",
    homepage: "https://www.nimh.nih.gov/",
    apiBase: "https://www.nimh.nih.gov/news/science-news/rss",
    needsKey: false,
    limits: [{ kind: "soft", note: "RSS — poll once daily" }],
    reliability: "institutional",
    toneClass: "lavender",
  },
  {
    slug: "samhsa",
    name: "SAMHSA",
    description: "U.S. Substance Abuse and Mental Health Services Administration — newsroom RSS.",
    homepage: "https://www.samhsa.gov/",
    apiBase: "https://www.samhsa.gov/newsroom/rss",
    needsKey: false,
    limits: [{ kind: "soft", note: "RSS feed" }],
    reliability: "institutional",
    toneClass: "pink",
  },
  {
    slug: "who-mh",
    name: "WHO Mental Health",
    description: "World Health Organization — global mental health news, reports & policy.",
    homepage: "https://www.who.int/health-topics/mental-health",
    needsKey: false,
    limits: [{ kind: "soft", note: "RSS feed" }],
    reliability: "institutional",
    toneClass: "babyblue",
  },
];

export function getSource(slug: string): SourceConfig | undefined {
  return SOURCES.find((s) => s.slug === slug);
}

export function formatLimit(l: RateLimit): string {
  switch (l.kind) {
    case "perSecond":
      return `${l.n}/s${l.note ? ` (${l.note})` : ""}`;
    case "perDay":
      return `${l.n.toLocaleString()}/day${l.note ? ` (${l.note})` : ""}`;
    case "perMonth":
      return `${l.n.toLocaleString()}/month${l.note ? ` (${l.note})` : ""}`;
    case "soft":
      return l.note;
  }
}
