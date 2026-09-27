import { describe, expect, it } from 'vitest';
import { calculate } from './calculate';
import { resolveCategory, requireMarketplace } from './marketplaces';
import { calculateTieredFee } from './tiers';
import type { FeeCalculationInput } from './types';

/**
 * Feste Sollwerte für die Gebührenberechnung.
 *
 * Diese Tests prüfen ausgerechnete Beträge, nicht nur Strukturen. Ändert sich
 * ein Satz oder eine Staffelgrenze, schlagen sie fehl — genau das ist ihr
 * Zweck: Eine stillschweigende Änderung der Gebührenlogik soll auffallen.
 */

const verkauf = (overrides: Partial<FeeCalculationInput>): FeeCalculationInput => ({
  marketplaceId: 'ebay',
  categoryId: 'handys-kommunikation',
  condition: 'new',
  itemPrice: 0,
  buyerShipping: 0,
  purchase: { amount: 0, vatDeductible: false },
  shipping: { amount: 0, vatDeductible: false },
  ...overrides,
});

describe('calculateTieredFee', () => {
  const medien = [{ upTo: 990, rate: 0.12 }, { rate: 0.03 }];

  it('rechnet jede Stufe nur auf ihren eigenen Betragsanteil', () => {
    // 990 × 12 % = 118,80 | 1.010 × 3 % = 30,30
    expect(calculateTieredFee(2000, medien)).toBeCloseTo(149.1, 2);
  });

  it('bleibt bei genau der Schwelle in der ersten Stufe', () => {
    expect(calculateTieredFee(990, medien)).toBeCloseTo(118.8, 2);
  });

  it('rechnet unterhalb der Schwelle rein mit dem ersten Satz', () => {
    expect(calculateTieredFee(500, medien)).toBeCloseTo(60, 2);
  });

  it('kommt mit einer einzigen offenen Stufe aus', () => {
    expect(calculateTieredFee(1000, [{ rate: 0.14 }])).toBeCloseTo(140, 2);
  });

  it('liefert für Betrag oder Stufen von null nichts', () => {
    expect(calculateTieredFee(0, medien)).toBe(0);
    expect(calculateTieredFee(1000, [])).toBe(0);
  });
});

describe('Medien-Staffelung: 12 % bis 990 €, darüber 3 %', () => {
  const kategorien = [
    'buecher',
    'filme-serien',
    'musik',
    'games',
    'sammeln-seltenes',
  ] as const;

  it.each(kategorien)('%s: 2.000 € ergibt 149,10 € Provision', (categoryId) => {
    const { fees } = calculate(verkauf({ categoryId, itemPrice: 2000 }));

    expect(fees.commissionNet).toBe(149.1);
    expect(fees.commissionBasis).toBe('tiered');
  });

  it.each(kategorien)('%s: 990 € bleibt bei 118,80 €', (categoryId) => {
    const { fees } = calculate(verkauf({ categoryId, itemPrice: 990 }));

    expect(fees.commissionNet).toBe(118.8);
    expect(fees.commissionBasis).toBe('standard');
  });
});

describe('Uhren & Schmuck: Staffelgrenze hängt am Shop-Abo', () => {
  const schmuck = (hasShopSubscription: boolean) =>
    calculate(
      verkauf({ categoryId: 'uhren-schmuck', itemPrice: 1000, hasShopSubscription }),
    ).fees;

  it('ohne Shop: 990 × 16 % + 10 × 3 % = 158,70 €', () => {
    expect(schmuck(false).commissionNet).toBe(158.7);
  });

  it('mit Shop: 500 × 16 % + 500 × 3 % = 95,00 €', () => {
    expect(schmuck(true).commissionNet).toBe(95);
  });

  it('der Shop senkt die Provision in dieser Kategorie', () => {
    expect(schmuck(true).commissionNet).toBeLessThan(schmuck(false).commissionNet);
  });
});

describe('Kategorien mit flachem Satz', () => {
  it('beauty-gesundheit: 1.000 € neu ergibt 140,00 € Provision', () => {
    const { fees } = calculate(verkauf({ categoryId: 'beauty-gesundheit', itemPrice: 1000 }));

    expect(fees.commissionNet).toBe(140);
    expect(fees.commissionPercent).toBe(14);
    expect(fees.commissionBasis).toBe('standard');
  });

  it('spielzeug ist gestaffelt, nicht flach', () => {
    // Korrigiert nach einer echten Abrechnung: 12 % bis 990 €, darüber 3 %.
    const { fees } = calculate(verkauf({ categoryId: 'spielzeug', itemPrice: 1000 }));

    expect(fees.commissionNet).toBe(119.1); // 990 × 12 % + 10 × 3 %
    expect(fees.commissionBasis).toBe('tiered');
  });
});

describe('Feste Verkaufsgebühr pro Bestellung', () => {
  it('10,00 € Bestellwert kostet 0,35 €', () => {
    expect(calculate(verkauf({ itemPrice: 10 })).fees.fixedFeeNet).toBe(0.35);
  });

  it('10,01 € Bestellwert kostet 0,45 €', () => {
    expect(calculate(verkauf({ itemPrice: 10.01 })).fees.fixedFeeNet).toBe(0.45);
  });
});

describe('Computer, Tablets & Netzwerk', () => {
  const computer = (condition: FeeCalculationInput['condition']) =>
    calculate(verkauf({ categoryId: 'computer-tablets-netzwerk', itemPrice: 1000, condition }))
      .fees;

  it('neu: 7 % Verkaufsprovision', () => {
    expect(computer('new').commissionPercent).toBe(7);
    expect(computer('new').commissionNet).toBe(70);
  });

  it('gebraucht: 5 %, weil die Kategorie von der 5-%-Regel umfasst ist', () => {
    expect(computer('used').commissionPercent).toBe(5);
    expect(computer('used').commissionNet).toBe(50);
    expect(computer('used').commissionBasis).toBe('reduced_condition');
  });
});

describe('Kategorie-Auflösung', () => {
  const ebay = requireMarketplace('ebay');

  it('nimmt die Kategorie-ID des Marktplatzes vor der gewählten Kategorie', () => {
    const match = resolveCategory(ebay, {
      externalId: '15032', // Handys & Kommunikation
      categoryId: 'uhren-schmuck',
    });

    expect(match?.category.id).toBe('handys-kommunikation');
    expect(match?.precision).toBe('exact');
  });

  it('nutzt die gewählte Kategorie, wenn keine ID vorliegt', () => {
    const match = resolveCategory(ebay, { categoryId: 'uhren-schmuck' });

    expect(match?.category.id).toBe('uhren-schmuck');
    // Auch eine bewusst gewählte Kategorie bleibt eine Hauptkategorie.
    expect(match?.precision).toBe('main_category');
  });

  it('fällt ohne jede Angabe auf die Standardkategorie zurück', () => {
    const match = resolveCategory(ebay, {});

    expect(match?.precision).toBe('fallback');
  });

  it('errät nichts anhand des Kategorienamens', () => {
    // Eine unbekannte ID darf nicht über Namensähnlichkeit aufgelöst werden.
    const match = resolveCategory(ebay, { externalId: '999999', categoryId: 'scanner' });

    expect(match?.category.id).toBe('scanner');
    expect(match?.precision).toBe('main_category');
  });
});

describe('Zusätzliche eBay-Gebührenarten', () => {
  it('summiert Angebots-, Options-, Auslands- und Währungsgebühren', () => {
    const { fees } = calculate(
      verkauf({
        itemPrice: 100,
        listingFeeNet: 0.5,
        optionsFeeNet: 1,
        internationalFeeNet: 1.6,
        currencyConversionNet: 2.5,
      }),
    );

    // 100 × 7 % + 0,45 Fixgebühr + 0,50 + 1,00 + 1,60 + 2,50
    expect(fees.totalFeeNet).toBe(13.05);
    expect(fees.listingFeeNet).toBe(0.5);
    expect(fees.internationalFeeNet).toBe(1.6);
  });

  it('senkt die Auszahlung entsprechend', () => {
    const ohne = calculate(verkauf({ itemPrice: 100 })).fees.payout;
    const mit = calculate(verkauf({ itemPrice: 100, internationalFeeNet: 1.6 })).fees.payout;

    expect(mit).toBeLessThan(ohne);
  });
});
