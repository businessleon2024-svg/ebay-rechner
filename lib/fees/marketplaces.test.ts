import { describe, expect, it } from 'vitest';
import { findCategory, MARKETPLACES } from './marketplaces';

/**
 * Die Gebührentabellen werden von Hand gepflegt. Diese Tests prüfen keine
 * Rechenlogik, sondern die Unversehrtheit der Daten – Tippfehler beim
 * Übertragen einer Gebührenübersicht fallen sonst erst im Einsatz auf.
 */
describe.each(MARKETPLACES.map((m) => [m.name, m] as const))('%s', (_name, marketplace) => {
  it('hat keine doppelten Kategorie-IDs', () => {
    const ids = marketplace.categories.map((category) => category.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('hat keine doppelten Kategorienamen', () => {
    const names = marketplace.categories.map((category) => category.name);

    expect(new Set(names).size).toBe(names.length);
  });

  it('verweist mit der Standardkategorie auf eine existierende Kategorie', () => {
    expect(findCategory(marketplace, marketplace.defaultCategoryId)).toBeDefined();
  });

  it('hält alle Provisionssätze in einem plausiblen Bereich', () => {
    for (const category of marketplace.categories) {
      expect(category.standardPercent).toBeGreaterThan(0);
      expect(category.standardPercent).toBeLessThanOrEqual(20);
    }
  });

  it('setzt den reduzierten Satz nie über den regulären', () => {
    for (const category of marketplace.categories) {
      if (category.reducedPercent === null) continue;
      expect(category.reducedPercent).toBeLessThanOrEqual(category.standardPercent);
    }
  });

  it('bietet einen reduzierten Satz nur an, wenn der Marktplatz ihn kennt', () => {
    if (marketplace.hasConditionDiscount) return;

    for (const category of marketplace.categories) {
      expect(category.reducedPercent).toBeNull();
    }
  });

  it('staffelt mit aufsteigenden Schwellen und offener letzter Stufe', () => {
    const alleStaffeln = marketplace.categories.flatMap((category) =>
      [category.tiers, category.tiersWithShop].filter((tiers) => tiers !== undefined),
    );

    for (const tiers of alleStaffeln) {
      expect(tiers.length).toBeGreaterThan(1);
      // Nur die letzte Stufe darf nach oben offen sein.
      expect(tiers.at(-1)!.upTo).toBeUndefined();
      expect(tiers.slice(0, -1).every((tier) => tier.upTo !== undefined)).toBe(true);

      const schwellen = tiers.slice(0, -1).map((tier) => tier.upTo!);
      expect([...schwellen].sort((a, b) => a - b)).toEqual(schwellen);

      for (const tier of tiers) {
        expect(tier.rate).toBeGreaterThan(0);
        expect(tier.rate).toBeLessThan(1);
      }
    }
  });

  it('beginnt jede Staffel mit dem Standardsatz der Kategorie', () => {
    for (const category of marketplace.categories) {
      if (!category.tiers) continue;
      expect(category.tiers[0].rate * 100).toBeCloseTo(category.standardPercent, 6);
    }
  });
});

describe('eBay-Kategorie-IDs', () => {
  const ebay = MARKETPLACES.find((marketplace) => marketplace.id === 'ebay')!;

  it('sind eindeutig, soweit hinterlegt', () => {
    const externalIds = ebay.categories
      .map((category) => category.externalId)
      .filter((id): id is string => id !== undefined);

    expect(new Set(externalIds).size).toBe(externalIds.length);
    expect(externalIds.length).toBeGreaterThan(0);
  });

  it('sind rein numerisch', () => {
    for (const category of ebay.categories) {
      if (!category.externalId) continue;
      expect(category.externalId).toMatch(/^\d+$/);
    }
  });
});
