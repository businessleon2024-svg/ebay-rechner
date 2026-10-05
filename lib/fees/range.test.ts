import { describe, expect, it } from 'vitest';
import { highestRatePercent, lowestReducedPercent } from './range';
import { EBAY, KAUFLAND, MARKETPLACES } from './marketplaces';
import type { FeeCategory, Marketplace } from './types';

/*
  `confidence` ist Pflichtfeld und bleibt es: Jeder hinterlegte Satz muss
  sagen, wie gut er belegt ist. Für die Spannweite spielt es keine Rolle,
  deshalb füllt der Helfer es auf, statt es in jeder Attrappe zu wiederholen.
*/
function kategorie(teil: Omit<FeeCategory, 'confidence'>): FeeCategory {
  return { confidence: 'unverified', ...teil };
}

function marktplatzMit(categories: readonly Omit<FeeCategory, 'confidence'>[]): Marketplace {
  return { ...EBAY, categories: categories.map(kategorie) };
}

describe('highestRatePercent', () => {
  it('findet den höchsten Grundsatz', () => {
    const marktplatz = marktplatzMit([
      { id: 'a', name: 'A', standardPercent: 7, reducedPercent: 5 },
      { id: 'b', name: 'B', standardPercent: 12, reducedPercent: null },
    ]);

    expect(highestRatePercent(marktplatz)).toBe(12);
  });

  it('übersieht eine Staffel nicht, die über dem Grundsatz liegt', () => {
    const marktplatz = marktplatzMit([
      {
        id: 'a',
        name: 'A',
        standardPercent: 7,
        reducedPercent: null,
        tiers: [{ upTo: 100, rate: 0.2 }, { rate: 0.03 }],
      },
    ]);

    expect(highestRatePercent(marktplatz)).toBe(20);
  });

  it('nimmt auch die Shop-Staffel mit', () => {
    const marktplatz = marktplatzMit([
      {
        id: 'a',
        name: 'A',
        standardPercent: 7,
        reducedPercent: null,
        tiersWithShop: [{ upTo: 100, rate: 0.18 }, { rate: 0.03 }],
      },
    ]);

    expect(highestRatePercent(marktplatz)).toBe(18);
  });

  /*
    Der Fall, der den Fehler ausgelöst hat: Die Startseite versprach "bis zu
    14 %", während Uhren & Schmuck längst mit 16 % hinterlegt war. Dieser Test
    hält die Aussage an den Daten fest, nicht an einer abgeschriebenen Zahl.
  */
  it('entspricht bei eBay dem höchsten Satz aus der Tabelle', () => {
    const ausTabelle = Math.max(...EBAY.categories.map((k) => k.standardPercent));

    expect(highestRatePercent(EBAY)).toBeGreaterThanOrEqual(ausTabelle);
    expect(highestRatePercent(EBAY)).toBe(16);
  });

  it('liefert für jeden Marktplatz einen brauchbaren Wert', () => {
    for (const marktplatz of MARKETPLACES) {
      const satz = highestRatePercent(marktplatz);
      expect(satz).toBeGreaterThan(0);
      expect(satz).toBeLessThan(100);
    }
  });
});

describe('lowestReducedPercent', () => {
  it('findet den niedrigsten reduzierten Satz', () => {
    const marktplatz = marktplatzMit([
      { id: 'a', name: 'A', standardPercent: 12, reducedPercent: 8 },
      { id: 'b', name: 'B', standardPercent: 7, reducedPercent: 5 },
    ]);

    expect(lowestReducedPercent(marktplatz)).toBe(5);
  });

  /*
    `null` heißt "kein reduzierter Satz ausgewiesen", nicht "null Prozent".
    Würde es als 0 gelesen, verspräche die Seite einen Satz, den es nicht gibt.
  */
  it('zählt Kategorien ohne reduzierten Satz nicht als null Prozent', () => {
    const marktplatz = marktplatzMit([
      { id: 'a', name: 'A', standardPercent: 16, reducedPercent: null },
      { id: 'b', name: 'B', standardPercent: 7, reducedPercent: 5 },
    ]);

    expect(lowestReducedPercent(marktplatz)).toBe(5);
  });

  it('gibt null zurück, wenn der Marktplatz gar keinen reduzierten Satz kennt', () => {
    const marktplatz = marktplatzMit([
      { id: 'a', name: 'A', standardPercent: 16, reducedPercent: null },
    ]);

    expect(lowestReducedPercent(marktplatz)).toBeNull();
  });

  it('eBay kennt den 5-%-Satz, Kaufland keinen', () => {
    expect(lowestReducedPercent(EBAY)).toBe(5);
    expect(lowestReducedPercent(KAUFLAND)).toBeNull();
  });
});
