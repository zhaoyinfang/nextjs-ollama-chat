import { ollama } from "ai-sdk-ollama";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const maxDuration = 30;

interface MessagePart {
  type: string;
  text?: string;
}

interface IncomingMessage {
  role: "user" | "assistant" | "system";
  parts?: MessagePart[];
  content?: string;
}

interface VektorEintrag {
  text: string;
  embedding: number[];
}

// ─── RAG Hilfsfunktionen ───────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}

let cachedVektoren: VektorEintrag[] | null = null;

function ladeVektoren(): VektorEintrag[] {
  if (cachedVektoren) return cachedVektoren;
  const vektorenPath = path.join(process.cwd(), "src/data/vektoren.json");
  if (!fs.existsSync(vektorenPath)) return [];
  cachedVektoren = JSON.parse(fs.readFileSync(vektorenPath, "utf-8"));
  return cachedVektoren!;
}

async function embedFrage(frage: string): Promise<number[]> {
  const res = await fetch("http://127.0.0.1:11434/api/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "nomic-embed-text", prompt: frage }),
  });
  const data = await res.json();
  return data.embedding as number[];
}

function findeAehnlicheFakten(frageEmbedding: number[], k = 3): string[] {
  const vektoren = ladeVektoren();
  if (vektoren.length === 0) return [];

  return vektoren
    .map((eintrag) => ({
      text: eintrag.text,
      score: cosineSimilarity(frageEmbedding, eintrag.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .filter((e) => e.score > 0.5)
    .map((e) => e.text);
}

// ─── Ollama Verbindungscheck ───────────────────────────────────────────────

async function checkOllamaConnection(): Promise<void> {
  await fetch("http://127.0.0.1:11434").catch(() => {
    throw new Error("ECONNREFUSED – Ollama nicht erreichbar");
  });
}

// ─── API Route ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    await checkOllamaConnection();

    const { messages } = await req.json();

    // Letzte Nutzerfrage für RAG extrahieren
    const letzteNachricht = [...messages]
      .reverse()
      .find((m: IncomingMessage) => m.role === "user");

    const frageText = letzteNachricht
      ? Array.isArray(letzteNachricht.parts)
        ? letzteNachricht.parts
            .filter((p: MessagePart) => p.type === "text")
            .map((p: MessagePart) => p.text)
            .join("")
        : (letzteNachricht.content ?? "")
      : "";

    // RAG: Frage embedden → ähnliche Fakten suchen
    let ragKontext = "";
    if (frageText) {
      const frageEmbedding = await embedFrage(frageText);
      const fakten = findeAehnlicheFakten(frageEmbedding);
      if (fakten.length > 0) {
        ragKontext = `\n\nRelevante Fakten über den Nutzer:\n${fakten.map((f) => `- ${f}`).join("\n")}`;
        console.log("[RAG] Gefundene Fakten:", fakten);
      }
    }

    // System-Prompt + RAG-Kontext
    const SYSTEM_PROMPT = `STRIKTE REGEL: Du bist ein professioneller KI-Assistent. Du musst den Benutzer ausnahmslos IMMER siezen (Nutze: Sie, Ihnen, Ihr, Ihre). Verwende NIEMALS 'du', 'dir' oder 'dein'. (z.B. 'Ich unterstütze Sie', 'Wie kann ich Ihnen helfen?').${ragKontext}`;

    const modelMessages = messages.map((m: IncomingMessage) => ({
      role: m.role,
      content: Array.isArray(m.parts)
        ? m.parts
            .filter((p) => p.type === "text")
            .map((p) => p.text)
            .join("")
        : (m.content ?? ""),
    }));

    const result = await streamText({
      model: ollama("llama3.2"),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[Chat API] Fehler:", error);

    return NextResponse.json(
      { error: "Ein unbekannter Fehler ist aufgetreten." },
      { status: 500 },
    );
  }
}
