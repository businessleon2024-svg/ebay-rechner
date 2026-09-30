/**
 * Auswertung der eBay Browse API für eine EAN.
 *
 * Der Zweck ist nicht, ein Produkt zu finden, sondern herauszufinden, in
 * welche **Unterkategorie** Verkäufer es tatsächlich einstellen. Genau diese
 * Angabe veröffentlicht eBay auf den Gebührenseiten nicht, und genau daran
 * ist die Berechnung der Logitech-Webcam gescheitert: Hauptkategorie 7 %,
 * abgerechnet wurden 12 %.
 *
 * Mehrere Angebote zur selben EAN stehen nicht zwingend in derselben
 * Kategorie. Deshalb wird gezählt statt das erste Angebot zu glauben — und
 * der Anteil mitgeliefert, damit die Oberfläche einen knappen Befund
 * ("4 von 11 Angeboten") anders darstellen kann als einen eindeutigen.
 *
 * Das Auswerten ist von allem Netzwerk getrennt, damit es ohne Zugangsdaten
 * geprüft werden kann.
 */

/** Was von einem Angebot gebraucht wird. Alles andere wird ignoriert. */
interface RohesAngebot {
  /**
   * Blattkategorien des Angebots, laut eBay in der Reihenfolge primär,
   * sekundär. Die primäre ist die, nach der abgerechnet wird.
   */
  leafCategoryIds?: unknown;
  /** In manchen Antworten zusätzlich mit Klarnamen. */
  categories?: unknown;
}

export interface KategorieBefund {
  /** eBay-Kategorie-Nummer der Blattkategorie. */
  id: string;
  /** Klarname, sofern die Antwort ihn mitliefert. */
  name?: string;
  /** Wie viele Angebote in dieser Kategorie stehen. */
  anzahl: number;
  /** Anteil an allen ausgewerteten Angeboten, 0 bis 1. */
  anteil: number;
}

export interface GtinBefund {
  gtin: string;
  /** Angebote, die eine verwertbare Kategorie hatten. */
  ausgewertet: number;
  /** Absteigend nach Häufigkeit. */
  kategorien: KategorieBefund[];
  /** Titel des ersten Angebots, als Beleg für den Nutzer. */
  beispielTitel?: string;
}

function istZeichenkette(wert: unknown): wert is string {
  return typeof wert === 'string' && wert.trim() !== '';
}

/**
 * Liest die primäre Blattkategorie eines Angebots.
 *
 * `leafCategoryIds` ist die verlässliche Angabe; `categories` liefert
 * zusätzlich Klarnamen, ist aber nicht in jeder Antwort enthalten. Deshalb
 * wird die Nummer aus dem einen Feld und der Name — falls vorhanden — aus
 * dem anderen genommen, statt sich auf eines von beiden zu verlassen.
 */
function kategorieVon(angebot: RohesAngebot): { id: string; name?: string } | null {
  const ids = Array.isArray(angebot.leafCategoryIds) ? angebot.leafCategoryIds : [];
  const id = ids.find(istZeichenkette);
  if (!id) return null;

  const kategorien = Array.isArray(angebot.categories) ? angebot.categories : [];
  const treffer = kategorien.find(
    (eintrag): eintrag is { categoryId: string; categoryName?: string } =>
      typeof eintrag === 'object' &&
      eintrag !== null &&
      (eintrag as { categoryId?: unknown }).categoryId === id,
  );

  const name = treffer && istZeichenkette(treffer.categoryName) ? treffer.categoryName : undefined;
  return { id, name };
}

/** Wertet eine Browse-Antwort aus. Unbekannte Felder werden übergangen. */
export function werteAntwortAus(gtin: string, antwort: unknown): GtinBefund {
  const angebote =
    typeof antwort === 'object' && antwort !== null && Array.isArray((antwort as { itemSummaries?: unknown }).itemSummaries)
      ? ((antwort as { itemSummaries: RohesAngebot[] }).itemSummaries)
      : [];

  const zaehler = new Map<string, KategorieBefund>();
  let ausgewertet = 0;

  for (const angebot of angebote) {
    const kategorie = kategorieVon(angebot);
    if (!kategorie) continue;
    ausgewertet++;

    const vorhanden = zaehler.get(kategorie.id);
    if (vorhanden) {
      vorhanden.anzahl++;
      // Ein einmal gefundener Klarname bleibt erhalten, auch wenn ihn das
      // nächste Angebot nicht mitliefert.
      vorhanden.name ??= kategorie.name;
    } else {
      zaehler.set(kategorie.id, { id: kategorie.id, name: kategorie.name, anzahl: 1, anteil: 0 });
    }
  }

  const kategorien = [...zaehler.values()]
    .map((eintrag) => ({ ...eintrag, anteil: ausgewertet === 0 ? 0 : eintrag.anzahl / ausgewertet }))
    // Bei Gleichstand nach Kategorienummer, damit die Ausgabe reproduzierbar ist.
    .sort((a, b) => b.anzahl - a.anzahl || a.id.localeCompare(b.id));

  const ersterTitel = angebote.find(
    (angebot): angebot is RohesAngebot & { title: string } =>
      istZeichenkette((angebot as { title?: unknown }).title),
  );

  return {
    gtin,
    ausgewertet,
    kategorien,
    beispielTitel: ersterTitel?.title,
  };
}
