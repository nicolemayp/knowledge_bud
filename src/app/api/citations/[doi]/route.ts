import { NextResponse } from "next/server";

/**
 * GET /api/citations/[doi]
 * Returns lineage from Crossref: papers cited BY this paper (its references).
 *
 * Free, no key. ~50 req/s in the polite pool.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ doi: string }> }
) {
  const { doi: rawDoi } = await params;
  const doi = decodeURIComponent(rawDoi);
  const headers: Record<string, string> = {};
  if (process.env.POLITE_EMAIL) {
    headers["User-Agent"] = `KnowledgeBud/1.0 (mailto:${process.env.POLITE_EMAIL})`;
  }

  try {
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      headers,
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Crossref ${res.status}` },
        { status: res.status }
      );
    }
    const data = (await res.json()) as {
      message?: {
        reference?: {
          key?: string;
          DOI?: string;
          "article-title"?: string;
          author?: string;
          year?: string;
          "journal-title"?: string;
          unstructured?: string;
        }[];
        "is-referenced-by-count"?: number;
      };
    };
    const refs = data.message?.reference ?? [];
    const cites = refs
      .slice(0, 30)
      .map((r) => ({
        doi: r.DOI ?? null,
        title: r["article-title"] ?? r.unstructured ?? "(no title)",
        author: r.author ?? null,
        year: r.year ? parseInt(r.year, 10) : null,
        journal: r["journal-title"] ?? null,
        url: r.DOI ? `https://doi.org/${r.DOI}` : null,
      }));
    return NextResponse.json({
      doi,
      cites, // papers this paper references
      citedByCount: data.message?.["is-referenced-by-count"] ?? 0,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
