/**
 * Auflösung einer eBay-Kategorienummer zu ihrem vollständigen Pfad.
 *
 * Die Browse-Abfrage liefert zu einer EAN nur die Nummer der Blattkategorie,
 * etwa 175672. Damit kann niemand etwas anfangen. Erst der Pfad macht sie
 * lesbar — „Computer, Tablets & Netzwerk › Webcams" — und erklärt zugleich,
 * warum die Abrechnung die Hauptkategorie nennt, aber nach der Unterkategorie
 * abrechnet.
 *
 * eBay liefert den Kategoriebaum als eine einzige, sehr große Antwort mit
 * zehntausenden Knoten. Ihn je Abfrage zu holen wäre Unsinn; er wird einmal
 * geholt und zu einer flachen Karte verarbeitet. Danach kostet jede weitere
 * Auflösung nichts mehr — weder Zeit noch Abrufkontingent.
 *
 * Das Umwandeln ist von jedem Netzzugriff getrennt, damit es prüfbar bleibt.
 */

/** Knoten, wie eBay ihn liefert. Nur die Felder, die hier gebraucht werden. */
interface Knoten {
  category?: { categoryId?: unknown; categoryName?: unknown };
  childCategoryTreeNodes?: unknown;
  leafCategoryTreeNode?: unknown;
}

export interface Kategoriepfad {
  /** Von der obersten Ebene bis zur Kategorie selbst. */
  namen: readonly string[];
  /** Dieselbe Kette als Nummern, für den Abgleich mit hinterlegten Sätzen. */
  nummern: readonly string[];
}

function istText(wert: unknown): wert is string {
  return typeof wert === 'string' && wert !== '';
}

/**
 * Wandelt den Baum in eine Karte „Kategorienummer → Pfad" um.
 *
 * Erfasst werden alle Knoten, nicht nur Blätter: Die Abrechnung nennt oft
 * einen Knoten weiter oben, und der soll genauso auflösbar sein.
 *
 * Absichtlich iterativ statt rekursiv — der Baum ist tief genug, dass eine
 * Rekursion je nach Marktplatz an den Aufrufstapel stoßen könnte.
 */
export function baueKategoriekarte(baum: unknown): Map<string, Kategoriepfad> {
  const karte = new Map<string, Kategoriepfad>();

  const wurzel =
    typeof baum === 'object' && baum !== null
      ? (baum as { rootCategoryNode?: unknown }).rootCategoryNode
      : undefined;
  if (typeof wurzel !== 'object' || wurzel === null) return karte;

  // Die Wurzel selbst ist keine echte Kategorie und gehört nicht in den Pfad.
  const stapel: Array<{ knoten: Knoten; pfadNamen: string[]; pfadNummern: string[] }> = [
    { knoten: wurzel as Knoten, pfadNamen: [], pfadNummern: [] },
  ];

  while (stapel.length > 0) {
    const { knoten, pfadNamen, pfadNummern } = stapel.pop()!;

    const kinder = Array.isArray(knoten.childCategoryTreeNodes)
      ? (knoten.childCategoryTreeNodes as Knoten[])
      : [];

    for (const kind of kinder) {
      if (typeof kind !== 'object' || kind === null) continue;
      const id = kind.category?.categoryId;
      const name = kind.category?.categoryName;
      if (!istText(id)) continue;

      const namen = istText(name) ? [...pfadNamen, name] : [...pfadNamen];
      const nummern = [...pfadNummern, id];

      // Der erste gefundene Pfad gewinnt: Eine Kategorie kann im Baum an
      // mehreren Stellen hängen, und ein stabiles Ergebnis ist mehr wert
      // als ein zufällig zuletzt überschriebenes.
      if (!karte.has(id)) karte.set(id, { namen, nummern });

      stapel.push({ knoten: kind, pfadNamen: namen, pfadNummern: nummern });
    }
  }

  return karte;
}

/** Pfad als lesbare Kette, wie eBay ihn auch im Angebot anzeigt. */
export function pfadAlsText(pfad: Kategoriepfad | undefined): string | undefined {
  return pfad && pfad.namen.length > 0 ? pfad.namen.join(' › ') : undefined;
}

/**
 * Sucht in der Kette die oberste Kategorie, für die ein Satz hinterlegt ist.
 *
 * Von oben nach unten, nicht umgekehrt: Hinterlegt sind Hauptkategorien, und
 * die stehen weiter oben. Gefunden wird damit der Eintrag, unter dem die
 * Abrechnung den Verkauf führt — nicht irgendein zufällig passendes Blatt.
 */
export function hinterlegterVorfahr(
  pfad: Kategoriepfad | undefined,
  bekannteNummern: ReadonlySet<string>,
): string | undefined {
  if (!pfad) return undefined;
  return pfad.nummern.find((nummer) => bekannteNummern.has(nummer));
}
