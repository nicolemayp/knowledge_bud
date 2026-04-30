/**
 * Common record shape returned by every source fetcher.
 * The refresh pipeline normalizes records into the `papers` table.
 */
export type SourceRecord = {
  externalId: string;       // PMID, DOI, OpenAlex ID, etc.
  doi?: string | null;
  title: string;
  abstract?: string | null;
  authors: string[];
  journal?: string | null;
  year?: number | null;
  publishedAt?: Date | null;
  url: string;
};

export type SourceFetcher = (
  query: string,
  opts?: { sinceDays?: number; max?: number }
) => Promise<SourceRecord[]>;
