/**
 * Crossref REST API — https://api.crossref.org
 * Free, no key. "Polite pool" with email gets priority.
 *
 * Crossref is metadata-only — abstracts are not always present, but
 * for many open-access journals they are. Falls back gracefully when
 * abstract is missing (the AI summary will skip these).
 */

import type { SourceRecord } from "./types";

const BASE = "https://api.crossref.org";

type CrItem = {
  DOI?: string;
  URL?: string;
  title?: string[];
  author?: { given?: string; family?: string }[];
  "container-title"?: string[];
  abstract?: string;
  published?: { "date-parts"?: number[][] };
  issued?: { "date-parts"?: number[][] };
  "published-online"?: { "date-parts"?: number[][] };
};

function parseDateParts(parts?: number[][]): {
  date?: Date;
  year?: number;
} {
  const dp = parts?.[0];
  if (!dp || !dp[0]) return {};
  const year = dp[0];
  const month = dp[1] ?? 1;
  const day = dp[2] ?? 1;
  return { date: new Date(year, month - 1, day), year };
}

function stripJatsXml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function searchCrossref(
  query: string,
  opts: { sinceDays?: number; max?: number } = {}
): Promise<SourceRecord[]> {
  const sinceDays = opts.sinceDays ?? 35;
  const max = opts.max ?? 10;
  const since = new Date(Date.now() - sinceDays * 24 * 3600 * 1000);
  const sinceStr = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, "0")}-${String(since.getDate()).padStart(2, "0")}`;

  const params = new URLSearchParams({
    query,
    rows: String(max),
    sort: "issued",
    order: "desc",
    filter: `from-pub-date:${sinceStr},type:journal-article`,
  });
  if (process.env.POLITE_EMAIL) {
    params.set("mailto", process.env.POLITE_EMAIL);
  }

  const res = await fetch(`${BASE}/works?${params.toString()}`, {
    headers: process.env.POLITE_EMAIL
      ? {
          "User-Agent": `KnowledgeBud/1.0 (mailto:${process.env.POLITE_EMAIL})`,
        }
      : {},
  });
  if (!res.ok) throw new Error(`Crossref failed: ${res.status}`);
  const data = (await res.json()) as {
    message?: { items?: CrItem[] };
  };
  const items = data.message?.items ?? [];

  return items
    .filter((it) => it.DOI && it.title?.[0])
    .map((it) => {
      const { date, year } = parseDateParts(
        it.published?.["date-parts"] ??
          it.issued?.["date-parts"] ??
          it["published-online"]?.["date-parts"]
      );
      const authors = (it.author ?? [])
        .map((a) => {
          if (a.family && a.given) {
            return `${a.given.charAt(0)}. ${a.family}`;
          }
          return a.family ?? "";
        })
        .filter(Boolean);
      return {
        externalId: it.DOI!,
        doi: it.DOI ?? null,
        title: it.title?.[0] ?? "(untitled)",
        abstract: it.abstract ? stripJatsXml(it.abstract) : null,
        authors,
        journal: it["container-title"]?.[0] ?? null,
        year: year ?? null,
        publishedAt: date ?? null,
        url: it.URL ?? `https://doi.org/${it.DOI}`,
      };
    });
}
