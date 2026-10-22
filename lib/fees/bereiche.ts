import type { FeeCategory, Marketplace } from './types';

/**
 * Kategorien nach Sache gruppieren statt nach Gebührenhöhe.
 *
 * Die Gebührentabelle ist nach Sätzen sortiert — Geräte 7 %, Zubehör 12 %.
 * Das ist die Sicht der Abrechnung, nicht die eines Verkäufers. Wer eine
 * Tastatur einstellt, sucht unter „Computer", nicht unter „Zubehör". Bei 54
 * Einträgen in einer flachen Liste findet er sie dort nie.
 *
 * Hier entstehen daraus zwei Ebenen: Oberkategorie, und darunter — nur wo
 * nötig — die genauere Auswahl.
 *
 * ## Warum das mehr ist als Bequemlichkeit
 *
 * In mehreren Oberkategorien liegen **verschiedene Sätze** nebeneinander.
 * Ein Rechner unter „Computer, Tablets & Netzwerk" kostet 7 %, eine Tastatur
 * in derselben Oberkategorie 12 %. Genau daran hat sich Leons Webcam-Verkauf
 * verrechnet. In der flachen Liste musste man wissen, dass man unter
 * „Zubehör" nachsehen muss. Mit zwei Ebenen sieht man beim Aufklappen, dass
 * es in derselben Oberkategorie zwei Sätze gibt.
 */

export interface Bereich {
  /** Anzeigename, zugleich die Kennung — Bereiche haben keine eigene ID. */
  name: string;
  kategorien: readonly FeeCategory[];
  /**
   * Liegen unter dieser Oberkategorie verschiedene Sätze? Dann lohnt der
   * Blick in die Unterauswahl besonders — die Oberfläche hebt das hervor.
   */
  uneinheitlich: boolean;
}

/** Oberkategorie eines Eintrags. Ohne Angabe steht er für sich. */
export function bereichVon(kategorie: FeeCategory): string {
  return kategorie.bereich ?? kategorie.name;
}

/**
 * Alle Oberkategorien eines Marktplatzes, in der Reihenfolge ihres ersten
 * Auftretens in der Gebührentabelle.
 *
 * Bewusst nicht alphabetisch: Die Tabelle ist nach Häufigkeit und
 * Verwandtschaft geordnet, und diese Ordnung ist nützlicher als das Alphabet
 * — „Computer" vor „Baby" ist für einen Reseller die richtige Reihenfolge.
 */
export function bereicheVon(marketplace: Marketplace): readonly Bereich[] {
  const nachName = new Map<string, FeeCategory[]>();

  for (const kategorie of marketplace.categories) {
    const name = bereichVon(kategorie);
    const vorhandene = nachName.get(name);
    if (vorhandene) vorhandene.push(kategorie);
    else nachName.set(name, [kategorie]);
  }

  return [...nachName].map(([name, kategorien]) => ({
    name,
    kategorien,
    uneinheitlich: new Set(kategorien.map((k) => k.standardPercent)).size > 1,
  }));
}

/** Oberkategorie, in der ein Eintrag liegt — oder `undefined`, wenn unbekannt. */
export function bereichFuerKategorie(
  marketplace: Marketplace,
  categoryId: string,
): Bereich | undefined {
  const kategorie = marketplace.categories.find((k) => k.id === categoryId);
  if (!kategorie) return undefined;
  const gesucht = bereichVon(kategorie);
  return bereicheVon(marketplace).find((b) => b.name === gesucht);
}

/**
 * Erster Eintrag einer Oberkategorie — die Vorauswahl, wenn jemand den
 * Bereich wechselt.
 *
 * Bewusst der erste und nicht der günstigste: Die Tabelle listet das
 * Hauptprodukt zuerst und das Zubehör danach. Wer „Computer" wählt, meint in
 * aller Regel einen Rechner, kein Kabel.
 */
export function ersteKategorieIn(bereich: Bereich): FeeCategory {
  return bereich.kategorien[0];
}
