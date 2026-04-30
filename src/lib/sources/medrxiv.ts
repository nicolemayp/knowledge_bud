/**
 * medRxiv preprints — https://api.biorxiv.org/details/medrxiv
 *
 * The native API is not full-text-search-friendly (it's date-window paged).
 * Fortunately Europe PMC indexes medRxiv preprints with full search. So
 * for v0 we route medRxiv queries via Europe PMC restricted to PPR source.
 */

import type { SourceRecord } from "./types";
import { searchEuropePMC } from "./europepmc";

export async function searchMedRxiv(
  query: string,
  opts: { sinceDays?: number; max?: number } = {}
): Promise<SourceRecord[]> {
  // SRC:PPR returns preprints; `(SRC:PPR AND ...)` lets us scope to medRxiv-flavor.
  const scoped = `(SRC:PPR) AND ${query}`;
  const records = await searchEuropePMC(scoped, opts);
  // Tag the URL so users land on medRxiv when possible.
  return records.map((r) => ({
    ...r,
    url:
      r.doi && r.doi.includes("10.1101")
        ? `https://www.medrxiv.org/content/${r.doi}v1`
        : r.url,
  }));
}
