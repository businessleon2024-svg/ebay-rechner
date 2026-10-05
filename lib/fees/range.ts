import type { Marketplace } from './types';

/**
 * Spannweite der hinterlegten Provisionssätze eines Marktplatzes.
 *
 * Auf der Startseite und in Erklärtexten steht eine Obergrenze ("bis zu X %").
 * Die wurde bisher als Zahl in den Text geschrieben — und lief prompt
 * auseinander: Nach der Korrektur der Sätze an echten Abrechnungen versprach
 * die Startseite weiter "bis zu 14 %", während Uhren & Schmuck mit 16 %
 * hinterlegt war. Wer eine Uhr verkaufte, las also eine zu niedrige Grenze.
 *
 * Deshalb wird die Zahl hier aus der Gebührentabelle abgeleitet statt
 * abgeschrieben. Ändert sich ein Satz, ändert sich der Text mit.
 */

/** Höchster Satz, der auf einen Euro Umsatz anfallen kann, in Prozent. */
export function highestRatePercent(marketplace: Marketplace): number {
  let highest = 0;

  for (const category of marketplace.categories) {
    highest = Math.max(highest, category.standardPercent);

    /*
      Staffeln werden mitgenommen, nicht übersprungen. Ein gestaffelter Satz
      kann über dem Grundsatz liegen, und für die Obergrenze zählt die erste
      Stufe — die gilt ab dem ersten Euro. Die Sätze stehen dort als Anteil
      (0,16), in der Kategorie dagegen in Prozent (16).
    */
    for (const tier of category.tiers ?? []) {
      highest = Math.max(highest, tier.rate * 100);
    }
    for (const tier of category.tiersWithShop ?? []) {
      highest = Math.max(highest, tier.rate * 100);
    }
  }

  return highest;
}

/**
 * Niedrigster reduzierter Satz, in Prozent — oder `null`, wenn der Marktplatz
 * gar keinen kennt.
 *
 * Kategorien ohne ausgewiesenen reduzierten Satz tragen bewusst `null` und
 * zählen hier nicht mit. Sie als 0 zu lesen würde einen Satz versprechen, den
 * es nicht gibt.
 */
export function lowestReducedPercent(marketplace: Marketplace): number | null {
  const reduced = marketplace.categories
    .map((category) => category.reducedPercent)
    .filter((percent): percent is number => percent !== null);

  return reduced.length > 0 ? Math.min(...reduced) : null;
}
