/**
 * OpenAlex client — https://api.openalex.org
 * No API key required. 100,000 requests/day free.
 * "Polite pool" gets priority — set POLITE_EMAIL.
 */

import type { SourceRecord } from "./types";

const BASE = "https://api.openalex.org";

type OAWork = {
  id: string;
  doi?: string | null;
  title?: string | null;
  display_name?: string | null;
  publication_year?: number | null;
  publication_date?: string | null;
  abstract_inverted_index?: Record<string, number[]> | null;
  primary_location?: { source?: { display_name?: string | null } | null } | null;
  authorships?: { author?: { display_name?: string | null } | null }[] | null;
};

function toUrl(work: OAWork): string {
  if (work.doi) return work.doi.startsWith("http") ? work.doi : `https://doi.org/${work.doi.replace(/^https?:\/\/doi\.org\//, "")}`;
  return work.id;
}

function reconstructAbstract(idx?: Record<string, number[]> | null): string | null {
  if (!idx) return null;
  const tokens: { word: string; pos: number }[] = [];
  for (const [word, positions] of Object.entries(idx)) {
    for (const p of positions) tokens.push({ word, pos: p });
  }
  tokens.sort((a, b) => a.pos - b.pos);
  return tokens.map((t) => t.word).join(" ");
}

export async function searchOpenAlex(
  query: string,
  opts: { sinceDays?: number; max?: number } = {}
): Promise<SourceRecord[]> {
  const sinceDays = opts.sinceDays ?? 35;
  const max = opts.max ?? 10;

  const since = new Date(Date.now() - sinceDays * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  const params = new URLSearchParams({
    search: query,
    filter: `from_publication_date:${since},type:article`,
    "per-page": String(max),
    sort: "publication_date:desc",
  });
  if (process.env.POLITE_EMAIL) {
    params.set("mailto", process.env.POLITE_EMAIL);
  }

  const res = await fetch(`${BASE}/works?${params.toString()}`);
  if (!res.ok) throw new Error(`OpenAlex failed: ${res.status}`);
  const data = (await res.json()) as { results?: OAWork[] };

  return (data.results ?? []).map((w) => ({
    externalId: w.id.replace(/^https?:\/\/openalex\.org\//, ""),
    doi: w.doi ?? null,
    title: w.title ?? w.display_name ?? "(untitled)",
    abstract: reconstructAbstract(w.abstract_inverted_index),
    authors:
      w.authorships
        ?.map((a) => a.author?.display_name)
        .filter((s): s is string => Boolean(s)) ?? [],
    journal: w.primary_location?.source?.display_name ?? null,
    year: w.publication_year ?? null,
    publishedAt: w.publication_date ? new Date(w.publication_date) : null,
    url: toUrl(w),
  }));
}
