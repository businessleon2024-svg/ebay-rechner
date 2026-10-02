import type { Meldung } from './parse';

/**
 * Macht aus einzelnen Meldungen einen belastbaren Befund.
 *
 * Eine einzelne Meldung ist ein Hinweis, keine Tatsache. Jemand vertippt
 * sich, verwechselt netto und brutto oder meldet einen Verkauf mit Shop-Rabatt
 * als Normalfall. Erst mehrere übereinstimmende Meldungen tragen eine
 * Änderung am hinterlegten Satz.
 *
 * Deshalb zählt diese Datei nicht nur, sondern misst auch die Einigkeit. Zehn
 * Meldungen, die sich widersprechen, sind weniger wert als zwei, die sich
 * decken — und das soll sichtbar sein, statt in einem Mittelwert zu
 * verschwinden, den es so nie gegeben hat.
 */

/** Gruppierung: Wonach soll ein Befund gebildet werden? */
export type Schluessel = 'kategorie' | 'unterkategorie' | 'ean';

export interface Befund {
  /** Wert des Gruppierungsmerkmals, etwa die Kategorie-Kennung. */
  gruppe: string;
  marktplatz: string;
  /** Wie viele Meldungen einen verwertbaren Satz genannt haben. */
  meldungen: number;
  /** Häufigster gemeldeter Satz. */
  satz: number;
  /** Wie viele Meldungen genau diesen Satz nennen. */
  einig: number;
  /** Anteil der Einigen, 0 bis 1. */
  einigkeit: number;
  /** Alle genannten Sätze mit ihrer Häufigkeit, absteigend. */
  verteilung: Array<{ satz: number; anzahl: number }>;
  /** Beispielprodukt, damit sich der Befund nachvollziehen lässt. */
  beispiel?: string;
}

/**
 * Leitet den gemeldeten Satz ab.
 *
 * Bevorzugt wird der ausdrücklich genannte Prozentsatz. Fehlt er, lässt er
 * sich aus Provision und Bemessungsgrundlage errechnen — viele Verkäufer
 * tippen lieber die beiden Beträge ab, die auf der Abrechnung stehen, als
 * selbst zu dividieren.
 */
export function satzAus(meldung: Meldung): number | undefined {
  if (meldung.satzTatsaechlich !== undefined && meldung.satzTatsaechlich > 0) {
    return runde(meldung.satzTatsaechlich);
  }
  if (
    meldung.provisionTatsaechlich !== undefined &&
    meldung.grundlage !== undefined &&
    meldung.grundlage > 0
  ) {
    return runde((meldung.provisionTatsaechlich / meldung.grundlage) * 100);
  }
  return undefined;
}

/*
  Auf zwei Nachkommastellen. eBay rechnet mit glatten Sätzen; was danach kommt,
  stammt aus Rundung in der Abrechnung und würde sonst jede Meldung zu einem
  eigenen Satz machen.
*/
function runde(wert: number): number {
  return Math.round(wert * 100) / 100;
}

function gruppenwert(meldung: Meldung, schluessel: Schluessel): string | undefined {
  switch (schluessel) {
    case 'kategorie':
      return meldung.kategorieGewaehlt;
    case 'unterkategorie':
      return meldung.kategorieAngebot;
    case 'ean':
      return meldung.ean;
  }
}

/**
 * Fasst Meldungen zu Befunden zusammen, absteigend nach Belegstärke.
 *
 * Sortiert wird nach Anzahl der Einigen, nicht nach Gesamtzahl: Ein Befund
 * mit drei übereinstimmenden Meldungen ist mehr wert als einer mit fünf, von
 * denen sich nur zwei decken.
 */
export function werteMeldungenAus(
  meldungen: readonly Meldung[],
  schluessel: Schluessel = 'kategorie',
): Befund[] {
  const gruppen = new Map<string, { marktplatz: string; saetze: number[]; beispiel?: string }>();

  for (const meldung of meldungen) {
    const gruppe = gruppenwert(meldung, schluessel)?.trim();
    const satz = satzAus(meldung);
    if (!gruppe || satz === undefined) continue;

    const marktplatz = meldung.marktplatz ?? 'unbekannt';
    // Marktplatz gehört in den Schlüssel: Dieselbe Kategorie-Kennung kann bei
    // eBay und Kaufland etwas anderes bedeuten.
    const kennung = `${marktplatz}::${gruppe}`;

    const vorhanden = gruppen.get(kennung);
    if (vorhanden) {
      vorhanden.saetze.push(satz);
      vorhanden.beispiel ??= meldung.produkt;
    } else {
      gruppen.set(kennung, { marktplatz, saetze: [satz], beispiel: meldung.produkt });
    }
  }

  const befunde: Befund[] = [];
  for (const [kennung, eintrag] of gruppen) {
    const gruppe = kennung.slice(kennung.indexOf('::') + 2);

    const haeufigkeit = new Map<number, number>();
    for (const satz of eintrag.saetze) haeufigkeit.set(satz, (haeufigkeit.get(satz) ?? 0) + 1);

    const verteilung = [...haeufigkeit.entries()]
      .map(([satz, anzahl]) => ({ satz, anzahl }))
      // Bei Gleichstand der kleinere Satz zuerst, damit das Ergebnis
      // reproduzierbar ist und nicht von der Eingabereihenfolge abhängt.
      .sort((a, b) => b.anzahl - a.anzahl || a.satz - b.satz);

    const [haeufigster] = verteilung;
    befunde.push({
      gruppe,
      marktplatz: eintrag.marktplatz,
      meldungen: eintrag.saetze.length,
      satz: haeufigster.satz,
      einig: haeufigster.anzahl,
      einigkeit: haeufigster.anzahl / eintrag.saetze.length,
      verteilung,
      beispiel: eintrag.beispiel,
    });
  }

  return befunde.sort((a, b) => b.einig - a.einig || b.einigkeit - a.einigkeit);
}

/**
 * Trägt ein Befund eine Änderung am hinterlegten Satz?
 *
 * Die Schwelle ist bewusst niedrig, aber nicht eins: Eine einzelne Meldung
 * ändert nichts, zwei übereinstimmende schon — bei Gebührensätzen ist der
 * Schaden einer zu späten Korrektur größer als der einer zu frühen, solange
 * jede Änderung nachvollziehbar bleibt.
 */
export const MINDESTBELEGE = 2;

export function istBelastbar(befund: Befund): boolean {
  // Mehrheit allein genügt nicht: Bei 2 zu 2 gibt es keinen Befund, sondern
  // einen Widerspruch, den ein Mensch ansehen muss.
  return befund.einig >= MINDESTBELEGE && befund.einigkeit > 0.5;
}

/** Befunde, die einem hinterlegten Satz widersprechen. */
export function weichtAb(befund: Befund, hinterlegterSatz: number): boolean {
  return Math.abs(befund.satz - hinterlegterSatz) >= 0.5;
}
