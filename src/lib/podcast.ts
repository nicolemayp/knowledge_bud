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
You write the script for the Knowledge Bud monthly podcast — a ~6-minute, two-host conversational digest of new mental-health research for working clinicians. Style modeled on NotebookLM's Audio Overviews: measured, formal, intellectually curious, two co-hosts in dialogue.

Hosts:
  EMMA — the researcher. Frames each paper, names the methodology, the population, the numbers. Speaks like a grounded science journalist. Doesn't dumb down but explains jargon when she uses it.
  ANDREW — the clinician. Reflects on what each finding means in the consulting room. Asks clarifying questions, names trade-offs, flags when to be cautious.

Voice & tone:
  • Formal-friendly — like NPR's Hidden Brain or Ezra Klein's interview style. NOT casual or chatty. NO fillers ("like", "you know", "totally").
  • Use full sentences. Modulate sentence length for rhythm.
  • Each turn is 1–4 sentences. Frequent speaker switches keep it dynamic.
  • Numbers spoken out (e.g. "thirty-eight percent", "Cohen's d of zero point seven one").
  • Define unfamiliar terms briefly, the FIRST time they appear ("a randomized controlled trial — meaning participants were randomly assigned to treatment or control").

Required structure:
  1. EMMA opens (2-3 sentences) — name the month, name the most striking finding, set the stakes.
  2. ANDREW responds (1-2 sentences) — frame why this matters clinically.
  3. EMMA: "Here's what we'll cover in the next six minutes…" — preview 3-5 papers.
  4. PER PAPER (4-5 papers, ~1 minute each):
     EMMA describes the paper (population, design, finding with numbers).
     ANDREW reacts and translates to practice (one specific clinical implication).
     EMMA adds a caveat or quality note.
     A natural transition into the next paper.
  5. CLOSE: ANDREW summarizes 2-3 takeaways for the week.
     EMMA closes: "We'll be back on the first of next month. As always, verify any of this with the original sources, which are linked in the app."

Format: each line MUST start with the speaker tag exactly:
  EMMA: <one or more sentences of dialogue>
  ANDREW: <one or more sentences of dialogue>

Each speaker turn on its own line, separated by a blank line. No stage directions, no markdown, no [bracketed notes]. Plain prose only — this gets read aloud verbatim.

Length: roughly 850–1100 words total of spoken text across both hosts.

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

  const userPrompt = `Month: ${args.monthLabel}\n\nPapers:\n\n${paperContext}\n\nWrite the full two-host conversational script now. Each line MUST start with EMMA: or ANDREW:.`;

  try {
    const res = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.6,
      max_tokens: 2800,
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

export const VOICE_EMMA = "en-US-EmmaMultilingualNeural";
export const VOICE_ANDREW = "en-US-AndrewMultilingualNeural";

type Turn = { voice: string; text: string };

/** Parse a tagged dialogue ("EMMA: …", "ANDREW: …") into ordered turns. */
function parseScript(script: string): Turn[] {
  const turns: Turn[] = [];
  const lines = script.split(/\n+/);
  for (const raw of lines) {
    const m = raw.match(/^\s*(EMMA|ANDREW)\s*:\s*(.+)$/i);
    if (!m) continue;
    const speaker = m[1].toUpperCase();
    const text = m[2].trim();
    if (!text) continue;
    const voice = speaker === "ANDREW" ? VOICE_ANDREW : VOICE_EMMA;
    // Coalesce same-speaker consecutive turns (in case Groq splits a thought)
    const last = turns[turns.length - 1];
    if (last && last.voice === voice) {
      last.text += " " + text;
    } else {
      turns.push({ voice, text });
    }
  }
  return turns;
}

/** Render one turn to an MP3 buffer using Edge TTS. */
async function ttsOnce(voice: string, text: string): Promise<Buffer | null> {
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    type WithBuf = {
      toArrayBuffer?: (t: string) => Promise<{ data: ArrayBuffer | Uint8Array }>;
    };
    type WithStream = {
      toStream?: (t: string) => { audioStream: NodeJS.ReadableStream };
    };
    const t = tts as unknown as WithBuf & WithStream;
    if (typeof t.toArrayBuffer === "function") {
      const result = await t.toArrayBuffer(text);
      const data = result.data;
      const u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
      return Buffer.from(u8);
    }
    if (typeof t.toStream === "function") {
      const { audioStream } = t.toStream(text);
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
    console.error(`[podcast.ttsOnce] failed (${voice}):`, e);
    return null;
  }
}

/**
 * Convert a two-host tagged script into a single MP3.
 * Approach: render each turn separately, then concatenate the MP3 frames.
 * Browsers handle frame-boundary concatenation of constant-bitrate MP3s
 * cleanly enough for podcast playback.
 */
export async function scriptToAudio(script: string): Promise<Buffer | null> {
  const turns = parseScript(script);
  if (turns.length === 0) {
    // Fall back to single-voice rendering of whole script.
    return ttsOnce(VOICE_EMMA, script);
  }
  const buffers: Buffer[] = [];
  for (const turn of turns) {
    // Edge TTS has practical per-request length limits; chunk long turns.
    const chunks = chunkText(turn.text, 700);
    for (const piece of chunks) {
      const buf = await ttsOnce(turn.voice, piece);
      if (buf) buffers.push(buf);
    }
  }
  if (buffers.length === 0) return null;
  return Buffer.concat(buffers);
}

function chunkText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + " " + s).trim().length > maxLen && cur) {
      chunks.push(cur.trim());
      cur = s;
    } else {
      cur = (cur + " " + s).trim();
    }
  }
  if (cur) chunks.push(cur.trim());
  return chunks;
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
  // Strip speaker tags before counting
  const plain = text.replace(/^\s*(EMMA|ANDREW)\s*:\s*/gim, "");
  const words = plain.split(/\s+/).filter(Boolean).length;
  return Math.round((words / 150) * 60);
}
