/**
 * Europe PMC — https://europepmc.org
 * Free JSON API. Mirrors PubMed + adds full-text and preprints (medRxiv, bioRxiv).
 * No key. Be reasonable (~10 req/s).
 */

import type { SourceRecord } from "./types";

const SEARCH = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

type EpmcResult = {
  id?: string;
  source?: string;
  pmid?: string;
  doi?: string;
  title?: string;
  authorString?: string;
  journalTitle?: string;
  pubYear?: string;
  firstPublicationDate?: string;
  abstractText?: string;
  fullTextUrlList?: { fullTextUrl?: { url?: string }[] };
};

export async function searchEuropePMC(
  query: string,
  opts: { sinceDays?: number; max?: number } = {}
): Promise<SourceRecord[]> {
  const sinceDays = opts.sinceDays ?? 35;
  const max = opts.max ?? 10;

  const since = new Date(Date.now() - sinceDays * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  // Europe PMC's date filter is `FIRST_PDATE:[YYYY-MM-DD TO YYYY-MM-DD]`.
  const term = `${query} AND FIRST_PDATE:[${since} TO 2099-12-31]`;
  const params = new URLSearchParams({
    query: term,
    format: "json",
    pageSize: String(max),
    sort: "FIRST_PDATE_D desc",
    resultType: "core",
  });

  const res = await fetch(`${SEARCH}?${params.toString()}`);
  if (!res.ok) throw new Error(`Europe PMC failed: ${res.status}`);
  const data = (await res.json()) as {
    resultList?: { result?: EpmcResult[] };
  };
  const results = data.resultList?.result ?? [];

  return results.map((r) => {
    const externalId = r.pmid ?? r.id ?? r.doi ?? `${r.source}-${Math.random()}`;
    const fallbackUrl = r.pmid
      ? `https://europepmc.org/article/MED/${r.pmid}`
      : r.doi
      ? `https://doi.org/${r.doi}`
      : "https://europepmc.org/";
    const fullText = r.fullTextUrlList?.fullTextUrl?.[0]?.url;
    return {
      externalId: String(externalId),
      doi: r.doi ?? null,
      title: r.title ?? "(untitled)",
      abstract: r.abstractText ?? null,
      authors: r.authorString
        ? r.authorString.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      journal: r.journalTitle ?? null,
      year: r.pubYear ? parseInt(r.pubYear, 10) : null,
      publishedAt: r.firstPublicationDate
        ? new Date(r.firstPublicationDate)
        : null,
      url: fullText ?? fallbackUrl,
    };
  });
}
