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
  const { chunkSize = 500, overlap = 50 } = options;

  // Stufe 1: Grob nach Kapiteln trennen (auf Original-Text mit Zeilenumbrüchen!)
  const kapitelAbschnitte = splitByKapitel(text);

  // Stufe 2: Jeden Abschnitt einzeln prüfen — zu lang? → weiter unterteilen
  const finaleChunks: string[] = [];

  for (const abschnitt of kapitelAbschnitte) {
    const bereinigterAbschnitt = abschnitt.replace(/\s+/g, " ").trim();

    if (bereinigterAbschnitt.length <= chunkSize) {
      // Kapitel ist kurz genug → als ein Chunk übernehmen
      finaleChunks.push(bereinigterAbschnitt);
    } else {
      // Kapitel ist zu lang → zusätzlich mit Fixed-Size-Logik unterteilen
      finaleChunks.push(...chunkFixedSize(abschnitt, chunkSize, overlap));
    }
  }

  return finaleChunks;
}
