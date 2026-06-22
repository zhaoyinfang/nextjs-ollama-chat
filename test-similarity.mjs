import fs from "fs";

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}

async function embed(text) {
  const res = await fetch("http://127.0.0.1:11434/api/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "nomic-embed-text", prompt: text }),
  });
  const data = await res.json();
  return data.embedding;
}

const vektoren = JSON.parse(fs.readFileSync("./src/data/vektoren.json", "utf-8"));

const frage = "was ist der Gesamtumsatz vom TechZhaoyin 2025?";
const frageEmbedding = await embed(frage);

const scores = vektoren.map((v, i) => ({
  index: i,
  text: v.text.slice(0, 60),
  score: cosineSimilarity(frageEmbedding, v.embedding),
}));

scores.sort((a, b) => b.score - a.score);

console.log(`Frage: "${frage}"\n`);
scores.forEach(s => {
  console.log(`Score ${s.score.toFixed(4)} [${s.index}] "${s.text}..."`);
});
