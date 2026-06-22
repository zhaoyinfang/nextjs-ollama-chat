import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { chunkText } from "@/src/utils/chunking";

export const maxDuration = 60; // PDFs mit vielen Chunks brauchen mehr Zeit zum Embedden

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const VEKTOREN_PATH = path.join(process.cwd(), "src/data/vektoren.json");

interface VektorEintrag {
  text: string;
  embedding: number[];
  quelle?: string; // Dateiname, aus dem der Chunk stammt
}

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────

async function embedText(text: string): Promise<number[]> {
  const res = await fetch("http://127.0.0.1:11434/api/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "nomic-embed-text", prompt: text }),
  });

  if (!res.ok) {
    throw new Error(`Ollama Embedding-Fehler: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.embedding as number[];
}

function ladeBestehendeVektoren(): VektorEintrag[] {
  if (!fs.existsSync(VEKTOREN_PATH)) return [];
  return JSON.parse(fs.readFileSync(VEKTOREN_PATH, "utf-8"));
}

// ─── API Route ───────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei empfangen." },
        { status: 400 },
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Nur PDF-Dateien werden unterstützt." },
        { status: 400 },
      );
    }

    // ─── 1. PDF dauerhaft speichern ─────────────────────────────────────
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const zeitstempel = Date.now();
    const dateiname = `${zeitstempel}-${file.name}`;
    const speicherPfad = path.join(UPLOADS_DIR, dateiname);

    fs.writeFileSync(speicherPfad, buffer);
    console.log(`[Upload] PDF dauerhaft gespeichert: ${speicherPfad}`);

    // ─── 2. Text aus PDF extrahieren (pdf-parse v2 API) ──────────────────
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const pdfDaten = await parser.getText();
    const extrahierterText = pdfDaten.text;

    console.log(`[Upload] Text extrahiert: ${extrahierterText.length} Zeichen`);

    if (!extrahierterText || extrahierterText.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "Aus dieser PDF konnte kein Text extrahiert werden (möglicherweise nur ein Scan/Bild).",
        },
        { status: 422 },
      );
    }

    // ─── 3. Text in Chunks aufteilen (mit Kontext-Anreicherung) ──────────
    const chunks = chunkText(extrahierterText, {
      chunkSize: 500,
      overlap: 50,
      dokumentTitel: file.name.replace(/\.pdf$/i, ""),
    });
    console.log(`[Upload] In ${chunks.length} Chunks aufgeteilt.`);

    // ─── 4. NEU: Jeden Chunk embedden ─────────────────────────────────────
    const neueVektoren: VektorEintrag[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[Upload] Embedde Chunk ${i + 1}/${chunks.length} ...`);
      const embedding = await embedText(chunk);
      neueVektoren.push({ text: chunk, embedding, quelle: file.name });
    }

    // ─── 5. NEU: In vektoren.json ergänzen (bestehende Einträge bleiben!) ─
    const bestehendeVektoren = ladeBestehendeVektoren();
    const alleVektoren = [...bestehendeVektoren, ...neueVektoren];

    fs.writeFileSync(
      VEKTOREN_PATH,
      JSON.stringify(alleVektoren, null, 2),
      "utf-8",
    );
    console.log(
      `[Upload] vektoren.json aktualisiert: ${alleVektoren.length} Einträge gesamt.`,
    );

    return NextResponse.json({
      success: true,
      originalName: file.name,
      gespeichertAls: dateiname,
      groesseInBytes: buffer.length,
      anzahlZeichen: extrahierterText.length,
      anzahlChunks: chunks.length, // NEU
      gesamtVektoren: alleVektoren.length, // NEU
    });
  } catch (error: unknown) {
    console.error("[Upload] Fehler:", error);
    const message =
      error instanceof Error ? error.message : "Unbekannter Fehler";
    return NextResponse.json(
      { error: `Fehler bei der PDF-Verarbeitung: ${message}` },
      { status: 500 },
    );
  }
}
