/**
 * Einmalig ausführen, um fakten.json → vektoren.json zu erstellen.
 *
 * Voraussetzung: Ollama läuft und nomic-embed-text ist installiert.
 *   ollama pull nomic-embed-text
 *
 * Ausführen:
 *   npx tsx scripts/embed.ts
 */

import fs from "fs";
import path from "path";

const OLLAMA_URL = "http://127.0.0.1:11434/api/embeddings";
const EMBED_MODEL = "nomic-embed-text";

const FAKTEN_PATH = path.join(process.cwd(), "src/data/fakten.json");
const VEKTOREN_PATH = path.join(process.cwd(), "src/data/vektoren.json");

interface VektorEintrag {
  text: string;
  embedding: number[];
}

async function embedText(text: string): Promise<number[]> {
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
  });

  if (!res.ok) {
    throw new Error(`Ollama Embedding-Fehler: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.embedding as number[];
}

// Kosinus-Ähnlichkeit: misst wie nah zwei Vektoren beieinander liegen (0 = verschieden, 1 = identisch)
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}

async function main() {
  console.log("📂 Lese fakten.json ...");
  const fakten: string[] = JSON.parse(fs.readFileSync(FAKTEN_PATH, "utf-8"));
  console.log(`✅ ${fakten.length} Fakten gefunden.\n`);

  const vektoren: VektorEintrag[] = [];

  for (let i = 0; i < fakten.length; i++) {
    const text = fakten[i];
    console.log(`🔄 [${i + 1}/${fakten.length}] Embedde: "${text}"`);

    const embedding = await embedText(text);
    vektoren.push({ text, embedding });

    console.log(`   → Vektor mit ${embedding.length} Dimensionen erstellt.`);
  }

  fs.writeFileSync(VEKTOREN_PATH, JSON.stringify(vektoren, null, 2), "utf-8");
  console.log(
    `\n✅ vektoren.json gespeichert mit ${vektoren.length} Einträgen!`,
  );
  console.log(`📍 Pfad: ${VEKTOREN_PATH}`);
}

main().catch((err) => {
  console.error("❌ Fehler:", err.message);
  process.exit(1);
});

// Export damit TypeScript nicht meckert
export { cosineSimilarity };
