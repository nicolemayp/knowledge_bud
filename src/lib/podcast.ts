import { put } from "@vercel/blob";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { getGroq, MODEL } from "./ai";

export type ScriptPaper = {
  title: string;
  bluf: string | null;
  clinicalImplications: string | null;
  journal: string | null;
  year: number | null;
  evidence?: string | null;
};

const SYSTEM_PROMPT = `
You write the script for a 5-minute monthly podcast episode of "Knowledge Bud" — a digest of new mental-health research for working therapists.

Tone: warm, curious, conversational. Like a smart friend reading the highlights to a colleague over coffee. Avoid jargon when you can; when you must use it, define it briefly.

Structure (write the actual spoken text, no stage directions):
1. Cold open (2 sentences) — a hook from the most striking finding.
2. Brief intro — "Welcome to Knowledge Bud's [Month] [Year] digest. This month we have N new papers — let's dig into the most useful ones."
3. 4–6 paper segments. For each: (a) one-sentence finding with numbers if available, (b) one-to-two sentences on what it means for clinical practice, (c) a quick note on confidence (RCT vs preprint vs cohort, etc.). Use the paper's title if needed but mostly speak naturally about the finding.
4. Wrap up — "Three takeaways to bring into your week:" then 3 short bullets, spoken as continuous prose.
5. Outro — "That's it for this month. Verify any of this with the original sources — links in the app. See you next month."

Length: roughly 700–900 words of spoken text. Plain prose only — no headers, no markdown, no [stage directions]. The text will be read aloud verbatim by a single warm, friendly voice.

Never invent statistics that aren't in the abstracts.
`.trim();

export async function generateScript(args: {
  papers: ScriptPaper[];
  monthLabel: string;
}): Promise<string | null> {
  const groq = getGroq();
  if (!groq) return null;
  if (args.papers.length === 0) return null;

  const paperContext = args.papers
    .slice(0, 8)
    .map(
      (p, i) =>
        `${i + 1}. ${p.title} (${p.journal ?? "Journal unknown"}, ${
          p.year ?? "year unknown"
        })${p.evidence && p.evidence !== "unknown" ? ` [${p.evidence}]` : ""}\n   FINDING: ${
          p.bluf ?? "(no summary available)"
        }\n   IMPLICATIONS: ${p.clinicalImplications ?? "(no implications drafted)"}`
    )
    .join("\n\n");

  const userPrompt = `Month: ${args.monthLabel}\n\nPapers:\n\n${paperContext}\n\nWrite the full spoken script now.`;

  try {
    const res = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.5,
      max_tokens: 2200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim() ?? "";
    return text || null;
  } catch (e) {
    console.error("[podcast.generateScript] failed:", e);
    return null;
  }
}

export const VOICE = "en-US-EmmaMultilingualNeural";

/** Convert a script to an MP3 Buffer via Microsoft Edge TTS (free, no key). */
export async function scriptToAudio(script: string): Promise<Buffer | null> {
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(
      VOICE,
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
    );
    // Older versions exposed toStream; v2 exposes toArrayBuffer.
    type WithBuf = { toArrayBuffer?: (t: string) => Promise<{ data: ArrayBuffer | Uint8Array }> };
    type WithStream = {
      toStream?: (t: string) => { audioStream: NodeJS.ReadableStream };
    };
    const t = tts as unknown as WithBuf & WithStream;
    if (typeof t.toArrayBuffer === "function") {
      const result = await t.toArrayBuffer(script);
      const data = result.data;
      const u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
      return Buffer.from(u8);
    }
    if (typeof t.toStream === "function") {
      const { audioStream } = t.toStream(script);
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        audioStream.on("data", (c: Buffer) => chunks.push(c));
        audioStream.on("end", () => resolve());
        audioStream.on("error", reject);
      });
      return Buffer.concat(chunks);
    }
    return null;
  } catch (e) {
    console.error("[podcast.scriptToAudio] failed:", e);
    return null;
  }
}

export async function uploadAudio(args: {
  monthKey: string;
  buffer: Buffer;
}): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("[podcast] BLOB_READ_WRITE_TOKEN not set");
    return null;
  }
  try {
    const blob = await put(`podcasts/${args.monthKey}.mp3`, args.buffer, {
      access: "public",
      contentType: "audio/mpeg",
      addRandomSuffix: true,
    });
    return blob.url;
  } catch (e) {
    console.error("[podcast.uploadAudio] failed:", e);
    return null;
  }
}

/** Helpers for month formatting. */
export function currentMonthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
export function monthLabel(d = new Date()): string {
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

/** Estimate word count → seconds (Edge TTS @ ~150 wpm). */
export function estimateDurationSec(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.round((words / 150) * 60);
}
