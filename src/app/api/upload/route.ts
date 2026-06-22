import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const maxDuration = 30;

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

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

    // Ordner anlegen, falls er noch nicht existiert
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Zeitstempel im Dateinamen, damit zwei gleich benannte PDFs sich nicht überschreiben
    const zeitstempel = Date.now();
    const dateiname = `${zeitstempel}-${file.name}`;
    const speicherPfad = path.join(UPLOADS_DIR, dateiname);

    fs.writeFileSync(speicherPfad, buffer);
    console.log(`[Upload] PDF dauerhaft gespeichert: ${speicherPfad}`);

    // Text aus dem PDF extrahieren (pdf-parse v2 nutzt eine Klasse statt Funktion)
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const pdfDaten = await parser.getText();
    const extrahierterText = pdfDaten.text;

    console.log(`[Upload] Text extrahiert: ${extrahierterText.length} Zeichen`);
    console.log(`[Upload] Vorschau: "${extrahierterText.slice(0, 200)}..."`);

    if (!extrahierterText || extrahierterText.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "Aus dieser PDF konnte kein Text extrahiert werden (möglicherweise nur ein Scan/Bild).",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      originalName: file.name,
      gespeichertAls: dateiname,
      groesseInBytes: buffer.length,
      anzahlZeichen: extrahierterText.length,
    });
  } catch (error: unknown) {
    console.error("[Upload] Fehler:", error);
    const message =
      error instanceof Error ? error.message : "Unbekannter Fehler";
    return NextResponse.json(
      { error: `Fehler beim Speichern der PDF: ${message}` },
      { status: 500 },
    );
  }
}
