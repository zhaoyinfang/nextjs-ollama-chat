import { ollama } from "ai-sdk-ollama";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const modelMessages = messages.map((m: any) => ({
    role: m.role,
    content: Array.isArray(m.parts)
      ? m.parts
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join("")
      : (m.content ?? ""),
  }));

  const result = await streamText({
    model: ollama("llama3.2"),
    //system: `IMPORTANT: You MUST ALWAYS respond in English, regardless of what language the user writes in. This is a strict rule. Never switch to another language. You are a professional, polite, and precise AI assistant. Always address the user informally.`,
    system:
      "STRIKTE REGEL: Du bist ein professioneller KI-Assistent. Du musst den Benutzer ausnahmslos IMMER siezen (Nutze: Sie, Ihnen, Ihr, Ihre). Verwende NIEMALS 'du', 'dir' oder 'dein'. (z.B. 'Ich unterstütze Sie', 'Wie kann ich Ihnen helfen?').",
    //"STRIKTE REGEL: Du bist ein professioneller KI-Assistent. Du musst den Benutzer ausnahmslos IMMER duzen (Nutze: Du, dir, ihr, euch). Verwende NIEMALS 'Sie', 'Ihnen' oder 'Ihr'. (z.B. 'Ich unterstütze dich', 'Wie kann ich dir helfen?').",
    messages: modelMessages,
  });

  // ✅ v5-kompatibles Stream-Format:
  return result.toUIMessageStreamResponse();
}
