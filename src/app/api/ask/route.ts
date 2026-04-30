import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({
      answer:
        "Ask Knowledge Bud isn't connected to Groq yet. Add GROQ_API_KEY to your environment to enable AI chat.",
    });
  }

  const { question } = (await req.json().catch(() => ({}))) as {
    question?: string;
  };
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }

  // TODO(phase-2): pull recent papers from DB matching the question's topics,
  // pass as context to Groq, and require it to cite by paper id.
  return NextResponse.json({
    answer:
      "AI chat is wired up but the feed-grounding step lands in the next iteration. For now this is a stub.",
  });
}
