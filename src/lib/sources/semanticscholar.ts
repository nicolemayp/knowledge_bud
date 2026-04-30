/**
 * Semantic Scholar Graph API.
 * Free, no key required (with relaxed limits). Polite to set
 * SEMANTIC_SCHOLAR_API_KEY for production traffic.
 *
 * https://api.semanticscholar.org/graph/v1
 *
 * Knowledge Bud uses ONLY verified fields (title, authors, abstract,
 * journal, year, doi). We do NOT use S2's auto-generated TLDR.
 */

import type { SourceRecord } from "./types";

const BASE = "https://api.semanticscholar.org/graph/v1";

type SsPaper = {
  paperId: string;
  externalIds?: { DOI?: string; PubMed?: string } | null;
  url?: string;
  title?: string;
  abstract?: string | null;
  year?: number | null;
  publicationDate?: string | null;
  authors?: { name?: string }[];
  venue?: string | null;
  journal?: { name?: string | null } | null;
};

export async function searchSemanticScholar(
  query: string,
  opts: { sinceDays?: number; max?: number } = {}
): Promise<SourceRecord[]> {
  const sinceDays = opts.sinceDays ?? 35;
  const max = opts.max ?? 10;
  const since = new Date(Date.now() - sinceDays * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  const fields = [
    "paperId",
    "externalIds",
    "url",
    "title",
    "abstract",
    "year",
    "publicationDate",
    "authors.name",
    "venue",
    "journal",
  ].join(",");

  const params = new URLSearchParams({
    query,
    publicationDateOrYear: `${since}:`,
    limit: String(max),
    fields,
  });

  const headers: Record<string, string> = {};
  if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
    headers["x-api-key"] = process.env.SEMANTIC_SCHOLAR_API_KEY;
  }

  const res = await fetch(`${BASE}/paper/search?${params.toString()}`, {
    headers,
  });
  if (!res.ok) throw new Error(`Semantic Scholar failed: ${res.status}`);
  const data = (await res.json()) as { data?: SsPaper[] };
  const results = data.data ?? [];

  return results.map((p) => {
    const doi = p.externalIds?.DOI ?? null;
    const pmid = p.externalIds?.PubMed ?? null;
    const url =
      p.url ??
      (doi ? `https://doi.org/${doi}` : `https://www.semanticscholar.org/paper/${p.paperId}`);
    return {
      externalId: p.paperId,
      doi,
      title: p.title ?? "(untitled)",
      abstract: p.abstract ?? null,
      authors: p.authors?.map((a) => a.name ?? "").filter(Boolean) ?? [],
      journal: p.journal?.name ?? p.venue ?? null,
      year: p.year ?? null,
      publishedAt: p.publicationDate ? new Date(p.publicationDate) : null,
      url,
    };
  });
}
