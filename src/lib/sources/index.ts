/**
 * Source dispatch — given a slug, return the fetcher.
 * Each fetcher returns SourceRecord[]; the refresh pipeline normalizes them.
 */
import type { SourceFetcher } from "./types";
import { searchPubMed } from "./pubmed";
import { searchOpenAlex } from "./openalex";
import { searchEuropePMC } from "./europepmc";
import { searchMedRxiv } from "./medrxiv";
import { searchSemanticScholar } from "./semanticscholar";
import { searchCrossref } from "./crossref";
import { searchPlos } from "./plos";
import { searchDoaj } from "./doaj";
import { searchNimh, searchSamhsa, searchWho } from "./rss";

export const FETCHERS: Record<string, SourceFetcher> = {
  pubmed: searchPubMed,
  openalex: searchOpenAlex,
  europepmc: searchEuropePMC,
  medrxiv: searchMedRxiv,
  semanticscholar: searchSemanticScholar,
  crossref: searchCrossref,
  plos: searchPlos,
  doaj: searchDoaj,
  nimh: searchNimh,
  samhsa: searchSamhsa,
  "who-mh": searchWho,
};

export function getFetcher(slug: string): SourceFetcher | null {
  return FETCHERS[slug] ?? null;
}
