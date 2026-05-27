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
    messages: modelMessages,
  });

  // ✅ v5-kompatibles Stream-Format:
  return result.toUIMessageStreamResponse();
}
