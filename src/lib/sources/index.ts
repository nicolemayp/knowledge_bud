/**
 * Source dispatch — given a slug, return the fetcher.
 * Each fetcher returns SourceRecord[]; the refresh pipeline normalizes them.
 */
import type { SourceFetcher } from "./types";
import { searchPubMed } from "./pubmed";
import { searchOpenAlex } from "./openalex";
import { searchEuropePMC } from "./europepmc";
import { searchMedRxiv } from "./medrxiv";

export const FETCHERS: Record<string, SourceFetcher> = {
  pubmed: searchPubMed,
  openalex: searchOpenAlex,
  europepmc: searchEuropePMC,
  medrxiv: searchMedRxiv,
};

export function getFetcher(slug: string): SourceFetcher | null {
  return FETCHERS[slug] ?? null;
}
