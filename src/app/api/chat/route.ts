import { ollama } from "ai-sdk-ollama";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import { USER_KNOWLEDGE } from "@/src/data/knowledge";

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

// Ollama-Verbindung vorab prüfen, damit der Fehler VOR dem Stream auftritt
async function checkOllamaConnection(): Promise<void> {
  await fetch("http://127.0.0.1:11434").catch(() => {
    throw new Error("ECONNREFUSED – Ollama nicht erreichbar");
  });
}

// const SYSTEM_PROMPT = `Du bist ein persönlicher KI-Assistent. Hier sind Fakten über den Nutzer: ${USER_KNOWLEDGE}. Nutze diese Informationen, wenn sie zur Frage passen. STRIKTE REGEL: Sieze den Nutzer immer.`;

// const SYSTEM_PROMPT = `IMPORTANT: You MUST ALWAYS respond in English, regardless of what language the user writes in. This is a strict rule. Never switch to another language. You are a professional, polite, and precise AI assistant. Always address the user informally.`;

const SYSTEM_PROMPT = `STRIKTE REGEL: Du bist ein professioneller KI-Assistent. Du musst den Benutzer ausnahmslos IMMER siezen (Nutze: Sie, Ihnen, Ihr, Ihre). Verwende NIEMALS 'du', 'dir' oder 'dein'. (z.B. 'Ich unterstütze Sie', 'Wie kann ich Ihnen helfen?'). Hier sind Fakten über den Nutzer:${USER_KNOWLEDGE}`;

export async function POST(req: Request) {
  try {
    await checkOllamaConnection();

    const { messages } = await req.json();

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

    // v5-kompatibles Stream-Format:
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[Chat API] Fehler:", error);

    // Allgemeiner Error Fallback
    return NextResponse.json(
      { error: "Ein unbekannter Fehler ist aufgetreten." },
      { status: 500 },
    );
  }
}
