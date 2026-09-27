import { describe, expect, it } from 'vitest';
import { describePerItemFee, describeReducedRate, describeStandardRate } from './describe';
import { findCategory, requireMarketplace } from './marketplaces';

const ebay = requireMarketplace('ebay');
const kaufland = requireMarketplace('kaufland');
const kategorie = (marktplatz: typeof ebay, id: string) => findCategory(marktplatz, id)!;

/**
 * Intl setzt vor € und % ein geschütztes Leerzeichen. Für den Vergleich mit
 * gewöhnlichen Leerzeichen im Test wird das vereinheitlicht.
 */
const normalisiert = (wert: string | null) => wert?.replace(/[  ]/g, ' ') ?? null;

describe('describeStandardRate', () => {
  it('nennt bei flachem Satz nur den Prozentwert', () => {
    expect(normalisiert(describeStandardRate(kategorie(ebay, 'handys-kommunikation')))).toBe('7 %');
  });

  it('beschreibt eine Staffelung mit Schwelle und Folgesatz', () => {
    expect(normalisiert(describeStandardRate(kategorie(ebay, 'buecher')))).toBe(
      '12 % bis 990,00 €, 3 % darüber',
    );
  });

  it('berücksichtigt die abweichende Schwelle mit Shop-Abo', () => {
    const schmuck = kategorie(ebay, 'uhren-schmuck');

    expect(normalisiert(describeStandardRate(schmuck, false))).toContain('990,00 €');
    expect(normalisiert(describeStandardRate(schmuck, true))).toContain('500,00 €');
  });
});

describe('describeReducedRate', () => {
  it('nennt den reduzierten Satz, wo es ihn gibt', () => {
    expect(normalisiert(describeReducedRate(kategorie(ebay, 'handys-kommunikation')))).toBe('5 %');
  });

  it('macht das Fehlen eines reduzierten Satzes sichtbar', () => {
    expect(describeReducedRate(kategorie(ebay, 'spielzeug'))).toBe('–');
    expect(describeReducedRate(kategorie(kaufland, 'computer'))).toBe('–');
  });
});

describe('describePerItemFee', () => {
  it('weist die Gebühr je Artikel aus', () => {
    expect(normalisiert(describePerItemFee(kategorie(kaufland, 'medien')))).toContain('0,70 €');
  });

  it('bleibt leer, wo keine anfällt', () => {
    expect(describePerItemFee(kategorie(kaufland, 'computer'))).toBeNull();
  });
});
