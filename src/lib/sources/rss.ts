/**
 * Generic RSS feed fetcher.
 *
 * RSS sources don't accept search queries — they emit recent items.
 * We post-filter by checking if the topic terms appear in the item's
 * title or description. The caller passes a comma-separated list of
 * topic keywords as the "query" string.
 *
 * Used for NIMH, SAMHSA, and WHO Mental Health.
 */

import type { SourceRecord, SourceFetcher } from "./types";

type RssItem = {
  title?: string;
  description?: string;
  link?: string;
  pubDate?: string;
  guid?: string;
  creator?: string;
};

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  // Match each <item>...</item> block (works for RSS 2.0).
  const blocks = xml.split(/<item[\s>]/i).slice(1);
  for (const raw of blocks) {
    const block = raw.split(/<\/item>/i)[0] ?? "";
    items.push({
      title: extract(block, "title"),
      description: extract(block, "description"),
      link: extract(block, "link"),
      pubDate: extract(block, "pubDate") ?? extract(block, "dc:date"),
      guid: extract(block, "guid"),
      creator: extract(block, "dc:creator"),
    });
  }
  // Try Atom too.
  if (items.length === 0) {
    const atomBlocks = xml.split(/<entry[\s>]/i).slice(1);
    for (const raw of atomBlocks) {
      const block = raw.split(/<\/entry>/i)[0] ?? "";
      items.push({
        title: extract(block, "title"),
        description: extract(block, "summary") ?? extract(block, "content"),
        link: extractLinkHref(block),
        pubDate: extract(block, "updated") ?? extract(block, "published"),
        guid: extract(block, "id"),
      });
    }
  }
  return items;
}

function extract(block: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  if (!m) return undefined;
  return cleanCdata(m[1]).trim();
}

function extractLinkHref(block: string): string | undefined {
  const m = block.match(/<link[^>]*href=["']([^"']+)["']/i);
  return m?.[1];
}

function cleanCdata(s: string): string {
  return s
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build a fetcher for a fixed RSS URL.
 * The source-name (used for the description/journal tag) is also captured.
 */
export function rssFetcher(opts: {
  url: string;
  sourceName: string;
}): SourceFetcher {
  return async function fetchRss(query, params = {}): Promise<SourceRecord[]> {
    const sinceDays = params.sinceDays ?? 90;
    const max = params.max ?? 5;
    const cutoff = new Date(Date.now() - sinceDays * 24 * 3600 * 1000);

    const res = await fetch(opts.url, {
      headers: { "User-Agent": "KnowledgeBud/1.0 (RSS reader)" },
    });
    if (!res.ok) throw new Error(`${opts.sourceName} RSS failed: ${res.status}`);
    const xml = await res.text();
    const items = parseRss(xml);

    // Topic match: split the query into keywords and check title/desc.
    const terms = query
      .toLowerCase()
      .split(/[,\s]+/)
      .filter((t) => t.length > 2 && !/^(and|or|the|of|in|to|by)$/.test(t));

    const matches: RssItem[] = items.filter((it) => {
      const text = `${it.title ?? ""} ${it.description ?? ""}`.toLowerCase();
      // Recent enough?
      const date = it.pubDate ? new Date(it.pubDate) : null;
      if (date && !isNaN(date.getTime()) && date < cutoff) return false;
      // At least one keyword hit
      return terms.some((t) => text.includes(t));
    });

    return matches.slice(0, max).map((it) => {
      const date = it.pubDate ? new Date(it.pubDate) : null;
      return {
        externalId: it.guid ?? it.link ?? `${opts.sourceName}-${Math.random()}`,
        doi: null,
        title: it.title ?? "(untitled)",
        abstract: it.description ?? null,
        authors: it.creator ? [it.creator] : [opts.sourceName],
        journal: opts.sourceName,
        year: date ? date.getFullYear() : null,
        publishedAt: date && !isNaN(date.getTime()) ? date : null,
        url: it.link ?? "",
      };
    });
  };
}

export const searchNimh = rssFetcher({
  url: "https://www.nimh.nih.gov/news/science-news/rss",
  sourceName: "NIMH",
});

export const searchSamhsa = rssFetcher({
  url: "https://www.samhsa.gov/newsroom/feed.xml",
  sourceName: "SAMHSA",
});

export const searchWho = rssFetcher({
  url: "https://www.who.int/feeds/entity/mediacentre/news/en/rss.xml",
  sourceName: "WHO",
});
