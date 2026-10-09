/**
 * Prüfung von Artikelnummern nach GTIN (EAN, UPC, ITF-14).
 *
 * Eine gemeldete EAN ist nur dann eine belastbare Produktkennung, wenn sie
 * überhaupt eine gültige Nummer ist. Ein Zahlendreher beim Abtippen fällt
 * ohne Prüfung niemandem auf — die Meldung landet in der Sammlung und zeigt
 * später auf ein Produkt, das es nicht gibt.
 *
 * Jede GTIN trägt ihre eigene Prüfziffer: Die übrigen Stellen werden von
 * rechts abwechselnd mit 3 und 1 gewichtet, summiert, und die Prüfziffer
 * füllt auf das nächste Vielfache von zehn auf. Damit erkennt man jeden
 * einzelnen Tippfehler und die meisten Vertauschungen benachbarter Ziffern.
 *
 * Framework-frei gehalten, damit die geplante Erweiterung dieselbe Prüfung
 * nutzen kann.
 */

/** Zulässige Längen: GTIN-8, UPC-A (12), EAN-13 und ITF-14. */
const GUELTIGE_LAENGEN = [8, 12, 13, 14];

/** Entfernt Leerzeichen und Bindestriche, wie sie beim Abtippen entstehen. */
export function normalizeGtin(value: string): string {
  return value.replace(/[\s-]/g, '');
}

/** Berechnet die Prüfziffer für die Stellen ohne Prüfziffer. */
function checkDigit(ohnePruefziffer: string): number {
  let summe = 0;
  // Von rechts nach links gewichten: die letzte Stelle mit 3, dann wechselnd.
  for (let i = ohnePruefziffer.length - 1, position = 0; i >= 0; i--, position++) {
    summe += Number(ohnePruefziffer[i]) * (position % 2 === 0 ? 3 : 1);
  }
  return (10 - (summe % 10)) % 10;
}

export type GtinCheck =
  | { status: 'leer' }
  | { status: 'gueltig'; normalized: string; laenge: number }
  | { status: 'keine_ziffern' }
  | { status: 'laenge'; laenge: number }
  | { status: 'pruefziffer'; erwartet: number };

/**
 * Prüft eine eingegebene Artikelnummer und beschreibt das Ergebnis, statt nur
 * wahr oder falsch zu liefern — die Eingabemaske soll sagen können, *was*
 * nicht stimmt.
 */
export function checkGtin(value: string): GtinCheck {
  const normalized = normalizeGtin(value);
  if (normalized === '') return { status: 'leer' };
  if (!/^\d+$/.test(normalized)) return { status: 'keine_ziffern' };
  if (!GUELTIGE_LAENGEN.includes(normalized.length)) {
    return { status: 'laenge', laenge: normalized.length };
  }

  const erwartet = checkDigit(normalized.slice(0, -1));
  if (erwartet !== Number(normalized.at(-1))) return { status: 'pruefziffer', erwartet };

  return { status: 'gueltig', normalized, laenge: normalized.length };
}

/** Kurzform für Stellen, an denen nur zählt, ob die Nummer stimmt. */
export function isValidGtin(value: string): boolean {
  return checkGtin(value).status === 'gueltig';
}
