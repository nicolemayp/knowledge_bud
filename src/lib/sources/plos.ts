/**
 * PLOS Search API — https://api.plos.org/search
 * Free, no key. ~7,200 req/day.
 *
 * Returns articles from PLOS open-access journals (PLOS ONE, Medicine,
 * Mental Health, etc.). All have full-text + abstracts.
 */

import type { SourceRecord } from "./types";

const SEARCH = "https://api.plos.org/search";

type PlosDoc = {
  id?: string;
  title_display?: string;
  author_display?: string[];
  journal?: string;
  abstract?: string[];
  publication_date?: string;
};

export async function searchPlos(
  query: string,
  opts: { sinceDays?: number; max?: number } = {}
): Promise<SourceRecord[]> {
  const sinceDays = opts.sinceDays ?? 35;
  const max = opts.max ?? 10;
  const since = new Date(Date.now() - sinceDays * 24 * 3600 * 1000);
  const sinceStr = since.toISOString().slice(0, 10) + "T00:00:00Z";

  // PLOS search uses a Solr-like syntax. We restrict to articles + recent.
  const q = `everything:(${query}) AND publication_date:[${sinceStr} TO NOW]`;
  const params = new URLSearchParams({
    q,
    rows: String(max),
    fl: "id,title_display,author_display,journal,abstract,publication_date",
    wt: "json",
    sort: "publication_date desc",
  });

  const res = await fetch(`${SEARCH}?${params.toString()}`);
  if (!res.ok) throw new Error(`PLOS failed: ${res.status}`);
  const data = (await res.json()) as {
    response?: { docs?: PlosDoc[] };
  };
  const docs = data.response?.docs ?? [];

  return docs
    .filter((d) => d.id && d.title_display)
    .map((d) => {
      const doi = d.id; // PLOS IDs are DOIs
      const date = d.publication_date ? new Date(d.publication_date) : null;
      return {
        externalId: doi!,
        doi: doi ?? null,
        title: d.title_display ?? "(untitled)",
        abstract: d.abstract?.join(" ").replace(/\s+/g, " ").trim() ?? null,
        authors: d.author_display ?? [],
        journal: d.journal ?? "PLOS",
        year: date ? date.getFullYear() : null,
        publishedAt: date && !isNaN(date.getTime()) ? date : null,
        url: `https://doi.org/${doi}`,
      };
    });
}
