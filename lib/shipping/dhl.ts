/**
 * DHL-Versandprodukte für den Paketversand innerhalb Deutschlands.
 *
 * ## Warum hier zwei verschiedene Arten von Wissen stehen
 *
 * **Maße und Gewichte sind hart.** Ob ein Karton von 40 × 30 × 20 cm in ein
 * Päckchen M passt, ist eine Frage der Geometrie und ändert sich nicht.
 * Diese Angaben sind belastbar.
 *
 * **Die Preise sind es nicht.** Sie ändern sich jährlich, unterscheiden sich
 * zwischen Filiale und Online-Frankierung, und vor allem: Wer als
 * Geschäftskunde einen Vertrag hat, zahlt ganz andere Beträge — oft die
 * Hälfte. Ein Reseller mit Vertrag, dem wir Privatkundenpreise vorrechnen,
 * bekommt eine Marge angezeigt, die es nicht gibt.
 *
 * Deshalb sind die hinterlegten Preise nur Vorgabewerte, ausdrücklich als
 * ungeprüft gekennzeichnet, und die Oberfläche lässt jeden seine eigenen
 * eintragen. Das ist keine Bequemlichkeit, sondern der einzige Weg, bei dem
 * die Zahl am Ende stimmt.
 *
 * Dasselbe Prinzip wie bei den Marktplatzgebühren: lieber sichtbar unsicher
 * als unsichtbar falsch.
 */

export interface Paketmass {
  /** Längste Kante in cm. */
  laenge: number;
  breite: number;
  hoehe: number;
}

export interface Versandprodukt {
  id: string;
  name: string;
  /** Höchstgewicht in kg. */
  maxGewicht: number;
  /** Höchstmaße in cm, längste Kante zuerst. */
  maxMass: Paketmass;
  /**
   * Vorgabepreis in EUR, brutto. **Ungeprüft** — siehe Dateikopf. Dient als
   * Startwert, bis der Nutzer seinen eigenen einträgt.
   */
  vorgabePreis: number;
}

/**
 * Stand der hinterlegten Vorgabepreise. Wird in der Oberfläche genannt,
 * damit jeder sieht, wie alt die Zahl ist, mit der gerechnet wird.
 */
export const PREISSTAND = '2026-01';

/*
  Aufsteigend nach Kapazität sortiert. `guenstigstesProdukt` verlässt sich
  darauf und nimmt das erste passende — das ist dann zugleich das kleinste
  und (bei DHL durchgängig) das billigste.
*/
export const DHL_PRODUKTE: readonly Versandprodukt[] = [
  {
    id: 'paeckchen-s',
    name: 'Päckchen S',
    maxGewicht: 2,
    maxMass: { laenge: 35, breite: 25, hoehe: 10 },
    vorgabePreis: 3.99,
  },
  {
    id: 'paeckchen-m',
    name: 'Päckchen M',
    maxGewicht: 2,
    maxMass: { laenge: 60, breite: 30, hoehe: 15 },
    vorgabePreis: 4.79,
  },
  {
    id: 'paket-2',
    name: 'Paket bis 2 kg',
    maxGewicht: 2,
    maxMass: { laenge: 60, breite: 30, hoehe: 15 },
    vorgabePreis: 5.49,
  },
  {
    id: 'paket-5',
    name: 'Paket bis 5 kg',
    maxGewicht: 5,
    maxMass: { laenge: 120, breite: 60, hoehe: 60 },
    vorgabePreis: 6.99,
  },
  {
    id: 'paket-10',
    name: 'Paket bis 10 kg',
    maxGewicht: 10,
    maxMass: { laenge: 120, breite: 60, hoehe: 60 },
    vorgabePreis: 10.49,
  },
  {
    id: 'paket-31',
    name: 'Paket bis 31,5 kg',
    maxGewicht: 31.5,
    maxMass: { laenge: 120, breite: 60, hoehe: 60 },
    vorgabePreis: 18.99,
  },
];

/**
 * Passt das Paket in das Produkt?
 *
 * Die Kanten werden **sortiert** verglichen, nicht der Reihe nach. Ein
 * Karton von 10 × 25 × 35 cm ist derselbe Karton wie 35 × 25 × 10 — man darf
 * ihn drehen. Wer stellvertretend Länge gegen Länge prüft, lehnt Pakete ab,
 * die tatsächlich passen; das ist der häufigste Fehler in solchen Rechnern.
 */
export function passtIn(produkt: Versandprodukt, mass: Paketmass, gewichtKg: number): boolean {
  if (gewichtKg > produkt.maxGewicht) return false;

  const paket = [mass.laenge, mass.breite, mass.hoehe].sort((a, b) => b - a);
  const grenze = [produkt.maxMass.laenge, produkt.maxMass.breite, produkt.maxMass.hoehe].sort(
    (a, b) => b - a,
  );

  return paket.every((kante, i) => kante <= grenze[i]);
}

/**
 * Günstigstes Produkt, in das das Paket passt — oder `null`, wenn keines
 * passt.
 *
 * `null` heißt nicht „kostenlos", sondern „so nicht versendbar". Die
 * Oberfläche muss das als eigenen Fall behandeln und nicht als 0 €.
 */
export function guenstigstesProdukt(
  mass: Paketmass,
  gewichtKg: number,
  preise: Readonly<Record<string, number>> = {},
): Versandprodukt | null {
  const passende = DHL_PRODUKTE.filter((p) => passtIn(p, mass, gewichtKg));
  if (passende.length === 0) return null;

  const preisVon = (p: Versandprodukt) => preise[p.id] ?? p.vorgabePreis;

  /*
    Nach Preis, nicht nach Reihenfolge: Mit eigenen Vertragspreisen kann ein
    größeres Produkt billiger sein als ein kleineres. Bei Gleichstand gewinnt
    das zuerst Gelistete, also das kleinere.
  */
  return passende.reduce((guenstigstes, kandidat) =>
    preisVon(kandidat) < preisVon(guenstigstes) ? kandidat : guenstigstes,
  );
}

/** Preis eines Produkts unter Berücksichtigung eigener Preise. */
export function preisFuer(
  produkt: Versandprodukt,
  preise: Readonly<Record<string, number>> = {},
): number {
  return preise[produkt.id] ?? produkt.vorgabePreis;
}
