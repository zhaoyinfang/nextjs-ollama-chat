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

    return NextResponse.json({
      success: true,
      originalName: file.name,
      gespeichertAls: dateiname,
      groesseInBytes: buffer.length,
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
