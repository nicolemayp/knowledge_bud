/**
 * PubMed E-utilities client.
 *
 * Two-step protocol:
 *   1. ESearch  → returns PMIDs matching a query.
 *   2. EFetch   → returns full XML metadata for those PMIDs.
 *
 * https://www.ncbi.nlm.nih.gov/books/NBK25500/
 *
 * Rate limits:
 *   - 3 req/s without an API key
 *   - 10 req/s with a free key (set PUBMED_API_KEY)
 */

import type { SourceRecord } from "./types";

const ESEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const EFETCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";

function paramsWithKey(extra: Record<string, string>): URLSearchParams {
  const p = new URLSearchParams({
    db: "pubmed",
    tool: "knowledgebud",
    email: process.env.POLITE_EMAIL ?? "noreply@knowledge-bud.app",
    ...extra,
  });
  if (process.env.PUBMED_API_KEY) p.set("api_key", process.env.PUBMED_API_KEY);
  return p;
}

async function searchPubMedIds(
  query: string,
  opts: { sinceDays?: number; retmax?: number } = {}
): Promise<string[]> {
  const sinceDays = opts.sinceDays ?? 35;
  const retmax = opts.retmax ?? 10;

  const term = `${query} AND ("last ${sinceDays} days"[PDat])`;
  const params = paramsWithKey({
    term,
    retmax: String(retmax),
    sort: "date",
    retmode: "json",
  });

  const res = await fetch(`${ESEARCH}?${params.toString()}`);
  if (!res.ok) throw new Error(`PubMed esearch failed: ${res.status}`);
  const data = (await res.json()) as {
    esearchresult?: { idlist?: string[] };
  };
  return data.esearchresult?.idlist ?? [];
}

async function fetchPubMedXml(pmids: string[]): Promise<SourceRecord[]> {
  if (pmids.length === 0) return [];
  const params = paramsWithKey({
    id: pmids.join(","),
    retmode: "xml",
  });
  const res = await fetch(`${EFETCH}?${params.toString()}`);
  if (!res.ok) throw new Error(`PubMed efetch failed: ${res.status}`);
  const xml = await res.text();
  return parsePubMedXml(xml);
}

export async function searchPubMed(
  query: string,
  opts: { sinceDays?: number; max?: number } = {}
): Promise<SourceRecord[]> {
  const ids = await searchPubMedIds(query, {
    sinceDays: opts.sinceDays,
    retmax: opts.max,
  });
  return fetchPubMedXml(ids);
}

// Back-compat exports for existing call sites.
export { searchPubMedIds as searchPubMedIdsLegacy, fetchPubMedXml as fetchPubMedRecords };

// ─── XML PARSING ────────────────────────────────────────────────────
function parsePubMedXml(xml: string): SourceRecord[] {
  const out: SourceRecord[] = [];
  const articleBlocks = xml.split(/<PubmedArticle>/).slice(1);
  for (const block of articleBlocks) {
    const pmid = grab(block, /<PMID[^>]*>(\d+)<\/PMID>/);
    if (!pmid) continue;
    const title =
      decode(grab(block, /<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/)) ??
      "(untitled)";
    const abstract = decode(
      collect(block, /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g).join(
        " "
      ) || undefined
    );
    const journal = decode(grab(block, /<Title>([\s\S]*?)<\/Title>/));
    const yearStr = grab(block, /<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/);
    const year = yearStr ? parseInt(yearStr, 10) : undefined;
    const doi = grab(
      block,
      /<ArticleId IdType="doi">([\s\S]*?)<\/ArticleId>/
    );

    const authors: string[] = [];
    const authorBlocks = collect(
      block,
      /<Author[^>]*>([\s\S]*?)<\/Author>/g
    );
    for (const a of authorBlocks) {
      const last = grab(a, /<LastName>([\s\S]*?)<\/LastName>/);
      const initials = grab(a, /<Initials>([\s\S]*?)<\/Initials>/);
      if (last) authors.push(initials ? `${initials} ${last}` : last);
    }

    out.push({
      externalId: pmid,
      doi: doi ?? null,
      title,
      abstract: abstract ?? null,
      authors,
      journal: journal ?? null,
      year: year ?? null,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    });
  }
  return out;
}

function grab(s: string, re: RegExp): string | undefined {
  const m = s.match(re);
  return m?.[1]?.trim();
}
function collect(s: string, re: RegExp): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const r = new RegExp(re.source, re.flags);
  while ((m = r.exec(s)) !== null) out.push(m[1]);
  return out;
}
function decode(s?: string): string | undefined {
  if (!s) return undefined;
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
