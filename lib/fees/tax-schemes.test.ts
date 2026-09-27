import { describe, expect, it } from 'vitest';
import { calculate, maxPurchasePrice } from './calculate';
import type { FeeCalculationInput } from './types';

/**
 * Referenzfall für alle drei Besteuerungsformen.
 *
 * Gebrauchtes Handy, Verkauf 300 € plus 5 € Käufer-Versand, Einkauf 150 €
 * ohne ausgewiesene Umsatzsteuer, eigenes Porto 5 € mit Umsatzsteuer.
 * Die eBay-Gebühr beträgt in allen Fällen 15,70 € netto, 18,68 € brutto.
 */
const basis: FeeCalculationInput = {
  marketplaceId: 'ebay',
  categoryId: 'handys-kommunikation',
  condition: 'used',
  itemPrice: 300,
  buyerShipping: 5,
  purchase: { amount: 150, vatDeductible: false },
  shipping: { amount: 5, vatDeductible: true },
};

describe('Regelbesteuerung', () => {
  const { profit } = calculate({ ...basis, taxScheme: 'standard' });

  it('führt die USt aus dem gesamten Bruttoverkaufspreis ab', () => {
    expect(profit.salesVat).toBe(48.7); // 305 × 19/119
    expect(profit.marginTaxBase).toBeNull();
  });

  it('trägt die Gebühren netto', () => {
    expect(profit.feeCost).toBe(15.7);
  });

  it('bleibt beim bisherigen Ergebnis', () => {
    expect(profit.profit).toBe(86.4);
  });
});

describe('Differenzbesteuerung nach § 25a', () => {
  const { profit } = calculate({ ...basis, taxScheme: 'margin' });

  it('besteuert nur die Spanne zwischen Verkauf und Einkauf', () => {
    expect(profit.marginTaxBase).toBe(155); // 305 − 150
    expect(profit.salesVat).toBe(24.75); // 155 × 19/119
  });

  it('lässt aus dem Einkauf keine Vorsteuer zu', () => {
    expect(profit.purchaseNet).toBe(150);
    expect(profit.purchaseVatDeducted).toBe(0);
  });

  it('lässt Vorsteuer aus Gebühren und Porto weiterhin zu', () => {
    expect(profit.feeCost).toBe(15.7); // netto, nicht brutto
    expect(profit.shippingNet).toBe(4.2); // 5 / 1,19
  });

  it('ergibt einen höheren Gewinn als die Regelbesteuerung', () => {
    // 280,25 − 150 − 4,20 − 15,70
    expect(profit.profit).toBe(110.35);
    expect(profit.profit).toBeGreaterThan(
      calculate({ ...basis, taxScheme: 'standard' }).profit.profit,
    );
  });

  it('erhebt bei Verkauf unter Einkaufspreis keine Umsatzsteuer', () => {
    const verlust = calculate({ ...basis, taxScheme: 'margin', itemPrice: 100 });

    expect(verlust.profit.marginTaxBase).toBe(0);
    expect(verlust.profit.salesVat).toBe(0);
  });

  it('ignoriert eine ausgewiesene USt auf dem Einkaufsbeleg', () => {
    // Die Differenzbesteuerung setzt einen Erwerb ohne USt-Ausweis voraus.
    const mitBeleg = calculate({
      ...basis,
      taxScheme: 'margin',
      purchase: { amount: 150, vatDeductible: true },
    });

    expect(mitBeleg.profit.purchaseNet).toBe(150);
  });
});

describe('Kleinunternehmer nach § 19', () => {
  const { profit } = calculate({ ...basis, taxScheme: 'small_business' });

  it('führt keine Umsatzsteuer auf den Verkauf ab', () => {
    expect(profit.salesVat).toBe(0);
    expect(profit.revenueNet).toBe(305);
  });

  it('trägt die Gebühren brutto, weil keine Vorsteuer abziehbar ist', () => {
    expect(profit.feeCost).toBe(18.68);
  });

  it('zieht auch aus dem Porto keine Vorsteuer ab', () => {
    expect(profit.shippingNet).toBe(5);
    expect(profit.inputVatDeducted).toBe(0);
  });

  it('ergibt den höchsten Gewinn der drei Formen', () => {
    // 305 − 150 − 5 − 18,68
    expect(profit.profit).toBe(131.32);

    const regel = calculate({ ...basis, taxScheme: 'standard' }).profit.profit;
    const differenz = calculate({ ...basis, taxScheme: 'margin' }).profit.profit;
    expect(profit.profit).toBeGreaterThan(differenz);
    expect(differenz).toBeGreaterThan(regel);
  });
});

describe('Maximaler Einkaufspreis je Besteuerungsform', () => {
  it.each(['standard', 'margin', 'small_business'] as const)(
    '%s: trifft den Zielgewinn punktgenau',
    (taxScheme) => {
      const limit = maxPurchasePrice({ ...basis, taxScheme }, 40);
      const erreicht = calculate({
        ...basis,
        taxScheme,
        purchase: { amount: limit, vatDeductible: false },
      }).profit.profit;

      expect(erreicht).toBeGreaterThanOrEqual(40);
      expect(erreicht).toBeLessThan(40.02);
    },
  );

  it('erlaubt bei Differenzbesteuerung einen höheren Einkaufspreis', () => {
    // Ein höherer Einkauf senkt dort zugleich die Steuerlast.
    expect(maxPurchasePrice({ ...basis, taxScheme: 'margin' }, 0)).toBeGreaterThan(
      maxPurchasePrice({ ...basis, taxScheme: 'standard' }, 0),
    );
  });

  it('gibt 0 zurück, wenn der Zielgewinn unerreichbar ist', () => {
    expect(maxPurchasePrice({ ...basis, taxScheme: 'margin' }, 10_000)).toBe(0);
  });
});
