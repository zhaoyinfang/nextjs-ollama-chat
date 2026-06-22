/**
 * Teilt einen langen Text in kleinere, überlappende Chunks auf.
 *
 * Zweistufiger Ansatz:
 *   Stufe 1 (Semantic):  Zuerst hart an Kapitel-Überschriften trennen
 *                         (z.B. "2.", "2.1", "3.2" am Zeilenanfang).
 *   Stufe 2 (Fixed-Size): Falls ein einzelnes Kapitel danach immer noch
 *                         zu lang ist, wird es zusätzlich in chunkSize-
 *                         Stücke mit Overlap unterteilt.
 *
 * So bleiben thematisch zusammengehörige Abschnitte (z.B. Finanzen vs.
 * Datenschutz) garantiert in getrennten Chunks — aber kein Chunk wird
 * trotzdem beliebig lang.
 */

export interface ChunkOptions {
  chunkSize?: number; // Zielgröße eines Chunks in Zeichen
  overlap?: number; // Überlappung zwischen aufeinanderfolgenden Chunks
  dokumentTitel?: string; // Wird jedem Chunk vorangestellt (Kontext-Anreicherung)
}

// Erkennt Kapitel-Überschriften wie "2.", "2.1", "3.2" am Zeilenanfang
const KAPITEL_MUSTER = /^\d+\.\d*\s+/;

/**
 * Stufe 1: Text anhand von Kapitel-Überschriften in grobe Abschnitte teilen.
 * Jede Zeile, die mit einer Kapitelnummer beginnt, startet einen neuen Abschnitt.
 */
function splitByKapitel(text: string): string[] {
  const zeilen = text.split("\n");
  const abschnitte: string[] = [];
  let aktuellerAbschnitt: string[] = [];

  for (const zeile of zeilen) {
    if (KAPITEL_MUSTER.test(zeile.trim()) && aktuellerAbschnitt.length > 0) {
      // Neue Kapitelüberschrift gefunden → bisherigen Abschnitt abschließen
      abschnitte.push(aktuellerAbschnitt.join("\n"));
      aktuellerAbschnitt = [zeile];
    } else {
      aktuellerAbschnitt.push(zeile);
    }
  }

  if (aktuellerAbschnitt.length > 0) {
    abschnitte.push(aktuellerAbschnitt.join("\n"));
  }

  return abschnitte.map((a) => a.trim()).filter((a) => a.length > 0);
}

/**
 * Stufe 2: Ein einzelner (zu langer) Textblock wird in feste Zeichengrößen
 * mit Overlap unterteilt — das ist die bisherige Fixed-Size-Logik.
 */
function chunkFixedSize(
  text: string,
  chunkSize: number,
  overlap: number,
): string[] {
  const bereinigt = text.replace(/\s+/g, " ").trim();

  if (bereinigt.length === 0) return [];
  if (bereinigt.length <= chunkSize) return [bereinigt];

  const chunks: string[] = [];
  let start = 0;

  while (start < bereinigt.length) {
    let end = start + chunkSize;

    if (end < bereinigt.length) {
      const teilstueck = bereinigt.slice(start, end);
      const letzterSatzendeIndex = Math.max(
        teilstueck.lastIndexOf(". "),
        teilstueck.lastIndexOf("! "),
        teilstueck.lastIndexOf("? "),
      );

      if (letzterSatzendeIndex > chunkSize * 0.5) {
        end = start + letzterSatzendeIndex + 1;
      }
    } else {
      end = bereinigt.length;
    }

    const chunk = bereinigt.slice(start, end).trim();
    if (chunk.length > 0) chunks.push(chunk);

    start = end - overlap;

    if (start <= 0 || end >= bereinigt.length) break;
  }

  return chunks;
}

export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const { chunkSize = 500, overlap = 50, dokumentTitel } = options;

  // Stufe 1: Grob nach Kapiteln trennen (auf Original-Text mit Zeilenumbrüchen!)
  const kapitelAbschnitte = splitByKapitel(text);

  // Stufe 2: Jeden Abschnitt einzeln prüfen — zu lang? → weiter unterteilen
  const finaleChunks: string[] = [];

  for (const abschnitt of kapitelAbschnitte) {
    const bereinigterAbschnitt = abschnitt.replace(/\s+/g, " ").trim();

    let abschnittsChunks: string[];
    if (bereinigterAbschnitt.length <= chunkSize) {
      // Kapitel ist kurz genug → als ein Chunk übernehmen
      abschnittsChunks = [bereinigterAbschnitt];
    } else {
      // Kapitel ist zu lang → zusätzlich mit Fixed-Size-Logik unterteilen
      abschnittsChunks = chunkFixedSize(abschnitt, chunkSize, overlap);
    }

    // NEU: Kontext-Anreicherung — Dokumenttitel + Kapitelüberschrift voranstellen.
    // Das hilft dem Embedding-Modell, auch isolierte Chunks (z.B. reine Aufzählungen
    // ohne den Firmennamen) korrekt der richtigen Frage zuzuordnen.
    const ersteZeile = abschnitt.trim().split("\n")[0];
    const kapitelUeberschrift = KAPITEL_MUSTER.test(ersteZeile)
      ? ersteZeile
      : null;

    const praefixTeile = [dokumentTitel, kapitelUeberschrift].filter(Boolean);
    const praefix =
      praefixTeile.length > 0 ? `${praefixTeile.join(" – ")}: ` : "";

    finaleChunks.push(...abschnittsChunks.map((c) => `${praefix}${c}`));
  }

  return finaleChunks;
}
