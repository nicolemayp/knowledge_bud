/**
 * DOAJ — Directory of Open Access Journals API
 * https://doaj.org/api/v3/
 *
 * Free, no key. Returns metadata for open-access articles.
 * Many entries lack abstracts, so the AI summary may skip them.
 */

import type { SourceRecord } from "./types";

const SEARCH = "https://doaj.org/api/v3/search/articles";

type DoajResult = {
  id?: string;
  bibjson?: {
    title?: string;
    abstract?: string;
    author?: { name?: string }[];
    journal?: { title?: string };
    year?: string | number;
    month?: string | number;
    identifier?: { type?: string; id?: string }[];
    link?: { url?: string; type?: string }[];
  };
};

export async function searchDoaj(
  query: string,
  opts: { sinceDays?: number; max?: number } = {}
): Promise<SourceRecord[]> {
  const max = opts.max ?? 10;
  const yearFrom = new Date().getFullYear() - 1;
  const safeQuery = query.replace(/[\[\]"]/g, " ");
  const params = new URLSearchParams({
    pageSize: String(max),
    sort: "created_date:desc",
  });
  const url = `${SEARCH}/${encodeURIComponent(
    `bibjson.title:(${safeQuery}) OR bibjson.keywords:(${safeQuery}) AND bibjson.year:>=${yearFrom}`
  )}?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`DOAJ failed: ${res.status}`);
  const data = (await res.json()) as { results?: DoajResult[] };
  const results = data.results ?? [];

  return results
    .filter((r) => r.bibjson?.title)
    .map((r) => {
      const b = r.bibjson!;
      const doi = b.identifier?.find(
        (i) => (i.type ?? "").toLowerCase() === "doi"
      )?.id;
      const link = b.link?.find((l) => l.type === "fulltext")?.url ?? b.link?.[0]?.url;
      const year =
        typeof b.year === "string" ? parseInt(b.year, 10) : b.year;
      let publishedAt: Date | null = null;
      if (year) {
        const month =
          typeof b.month === "string" ? parseInt(b.month, 10) : b.month;
        publishedAt = new Date(year, (month ?? 1) - 1, 1);
      }
      return {
        externalId: doi ?? r.id ?? `doaj-${Math.random()}`,
        doi: doi ?? null,
        title: b.title ?? "(untitled)",
        abstract: b.abstract ?? null,
        authors: b.author?.map((a) => a.name ?? "").filter(Boolean) ?? [],
        journal: b.journal?.title ?? null,
        year: year ?? null,
        publishedAt,
        url: link ?? (doi ? `https://doi.org/${doi}` : "https://doaj.org/"),
      };
    });
}
