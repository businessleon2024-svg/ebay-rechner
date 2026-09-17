import { describe, expect, it } from 'vitest';
import { breakEvenSellPrice, calculate, maxPurchasePrice, UnknownCategoryError } from './calculate';
import type { FeeCalculationInput } from './types';

/** Gebrauchtes Handy: der typische Reseller-Fall. */
const usedPhone: FeeCalculationInput = {
  marketplaceId: 'ebay',
  categoryId: 'handys-kommunikation',
  condition: 'used',
  itemPrice: 300,
  buyerShipping: 5,
  purchase: { amount: 150, vatDeductible: false },
  shipping: { amount: 5, vatDeductible: true },
};

describe('Bemessungsgrundlage der Verkaufsprovision', () => {
  it('bezieht die vom Käufer gezahlten Versandkosten mit ein', () => {
    const { fees } = calculate(usedPhone);

    expect(fees.grossTransactionAmount).toBe(305);
    // 305 * 5 % – nicht 300 * 5 %
    expect(fees.commissionNet).toBe(15.25);
  });

  it('rechnet bei Gratisversand nur auf den Artikelpreis', () => {
    const { fees } = calculate({ ...usedPhone, buyerShipping: 0 });

    expect(fees.grossTransactionAmount).toBe(300);
    expect(fees.commissionNet).toBe(15);
  });
});

describe('Fixgebühr pro Bestellung', () => {
  it('beträgt 0,35 EUR unterhalb von 10 EUR Bestellwert', () => {
    const { fees } = calculate({ ...usedPhone, itemPrice: 8, buyerShipping: 0 });
    expect(fees.fixedFeeNet).toBe(0.35);
  });

  it('beträgt bei genau 10 EUR noch 0,35 EUR', () => {
    // "bis einschließlich 10,00 EUR" – die Schwelle selbst zählt zum
    // niedrigeren Satz, nicht zum höheren.
    const { fees } = calculate({ ...usedPhone, itemPrice: 10, buyerShipping: 0 });
    expect(fees.fixedFeeNet).toBe(0.35);
  });

  it('beträgt erst oberhalb von 10 EUR 0,45 EUR', () => {
    const { fees } = calculate({ ...usedPhone, itemPrice: 10.01, buyerShipping: 0 });
    expect(fees.fixedFeeNet).toBe(0.45);
  });
});

describe('Artikelzustand', () => {
  it('wendet in reformierten Kategorien 5 % auf gebrauchte Artikel an', () => {
    const { fees } = calculate(usedPhone);

    expect(fees.commissionPercent).toBe(5);
    expect(fees.commissionBasis).toBe('reduced_condition');
  });

  it('wendet auf Neuware den regulären Kategoriesatz an', () => {
    const { fees } = calculate({ ...usedPhone, condition: 'new' });

    expect(fees.commissionPercent).toBe(7);
    expect(fees.commissionBasis).toBe('standard');
    expect(fees.commissionNet).toBe(21.35); // 305 * 7 %
  });

  it('behandelt "Neu: Sonstige" wie gebraucht', () => {
    expect(calculate({ ...usedPhone, condition: 'new_other' }).fees.commissionPercent).toBe(5);
  });

  it('gewährt den reduzierten Satz nicht in nicht teilnehmenden Kategorien', () => {
    const { fees } = calculate({
      ...usedPhone,
      categoryId: 'kleidung-accessoires',
      condition: 'used',
    });

    expect(fees.commissionBasis).toBe('standard');
    expect(fees.commissionPercent).toBe(12);
  });

  it('wendet 5 % nur an, wo die Kategorie ihn ausdrücklich vorsieht', () => {
    // Der reduzierte Satz gilt nicht pauschal für jede Kategorie. Kategorien
    // ohne Beleg tragen reducedPercent: null und bleiben beim Standardsatz.
    const ohneBeleg = ['games', 'spielzeug', 'buecher', 'sammeln-seltenes'];

    for (const categoryId of ohneBeleg) {
      const { fees } = calculate({ ...usedPhone, categoryId, condition: 'used' });
      expect(fees.commissionBasis).toBe('standard');
      expect(fees.commissionPercent).not.toBe(5);
    }
  });

  it('behandelt alle gebrauchten und generalüberholten Abstufungen gleich', () => {
    const reduziert = [
      'new_other',
      'refurbished_certified',
      'refurbished_excellent',
      'refurbished_very_good',
      'refurbished_good',
      'refurbished_seller',
      'used',
      'used_excellent',
      'used_good',
      'used_acceptable',
    ] as const;

    for (const condition of reduziert) {
      expect(calculate({ ...usedPhone, condition }).fees.commissionPercent).toBe(5);
    }

    expect(calculate({ ...usedPhone, condition: 'new' }).fees.commissionPercent).toBe(7);
  });
});

describe('Staffelung nicht reformierter Kategorien', () => {
  it('rechnet oberhalb von 990 EUR nur noch 3 % auf den Mehrbetrag', () => {
    const { fees } = calculate({
      ...usedPhone,
      categoryId: 'kleidung-accessoires',
      condition: 'new',
      itemPrice: 1990,
      buyerShipping: 0,
    });

    // 990 * 12 % + 1000 * 3 %
    expect(fees.commissionNet).toBe(148.8);
    expect(fees.commissionBasis).toBe('tiered');
    expect(fees.commissionPercent).toBe(7.48);
  });

  it('lässt die Staffelung unterhalb der Schwelle unberührt', () => {
    const { fees } = calculate({
      ...usedPhone,
      categoryId: 'kleidung-accessoires',
      condition: 'new',
      itemPrice: 500,
      buyerShipping: 0,
    });

    expect(fees.commissionBasis).toBe('standard');
    expect(fees.commissionNet).toBe(60);
  });
});

describe('Umsatzsteuer (Regelbesteuerung)', () => {
  it('führt die USt aus dem Bruttoverkaufspreis ab', () => {
    const { profit } = calculate(usedPhone);

    expect(profit.revenueNet).toBe(256.3);
    expect(profit.salesVat).toBe(48.7);
  });

  it('weist die eBay-Gebühr netto, USt und brutto getrennt aus', () => {
    const { fees } = calculate(usedPhone);

    expect(fees.totalFeeNet).toBe(15.7);
    expect(fees.feeVat).toBe(2.98);
    expect(fees.totalFeeGross).toBe(18.68);
  });

  it('weist die Auszahlung als Gesamtbetrag abzüglich Bruttogebühren aus', () => {
    const { fees } = calculate(usedPhone);

    expect(fees.payout).toBe(286.32); // 305,00 − 18,68
  });

  it('zieht ohne ausgewiesene USt auf dem Einkaufsbeleg keine Vorsteuer ab', () => {
    const { profit } = calculate(usedPhone);

    expect(profit.purchaseNet).toBe(150);
    // Der eigene Versand ist vorsteuerabzugsfähig – das darf nicht auf den
    // Einkauf abfärben, sonst wird die Position falsch ausgewiesen.
    expect(profit.purchaseVatDeducted).toBe(0);
    expect(profit.inputVatDeducted).toBeGreaterThan(0);
  });

  it('zieht bei Einkauf mit USt-Rechnung die Vorsteuer ab', () => {
    const { profit } = calculate({
      ...usedPhone,
      purchase: { amount: 150, vatDeductible: true },
    });

    expect(profit.purchaseNet).toBe(126.05); // 150 / 1,19
  });
});

describe('Gewinn und Kennzahlen', () => {
  it('berechnet Gewinn, Marge und ROI', () => {
    const { profit } = calculate(usedPhone);

    expect(profit.profit).toBe(86.4);
    expect(profit.marginPercent).toBe(33.71);
    expect(profit.roiPercent).toBe(57.6);
  });

  it('liefert eine Aufschlüsselung, die exakt aufgeht', () => {
    const { fees, profit } = calculate(usedPhone);

    const sum =
      profit.revenueNet -
      profit.purchaseNet -
      profit.shippingNet -
      profit.otherCostsNet -
      fees.totalFeeNet;

    expect(Number(sum.toFixed(2))).toBe(profit.profit);
  });

  it('weist einen Verlust negativ aus', () => {
    const { profit } = calculate({ ...usedPhone, itemPrice: 100 });

    expect(profit.profit).toBeLessThan(0);
  });
});

describe('Zusatzkosten', () => {
  it('berücksichtigt Werbeanzeigen anteilig am Verkaufsbetrag', () => {
    const { fees } = calculate({ ...usedPhone, adRatePercent: 4 });

    expect(fees.adFeeNet).toBe(12.2); // 305 * 4 %
    expect(fees.totalFeeNet).toBe(27.9);
  });

  it('zieht den Shop-Provisionsrabatt von der Provision ab', () => {
    const { fees } = calculate({ ...usedPhone, shopDiscountPercent: 10 });

    expect(fees.shopDiscountNet).toBe(1.53); // 10 % von 15,25
    expect(fees.totalFeeNet).toBe(14.18);
  });

  it('rechnet sonstige Kosten wie Verpackung mit ein', () => {
    const withPackaging = calculate({
      ...usedPhone,
      otherCosts: { amount: 2.38, vatDeductible: true },
    });

    expect(withPackaging.profit.otherCostsNet).toBe(2);
    expect(withPackaging.profit.profit).toBe(84.4);
  });
});

describe('maxPurchasePrice', () => {
  it('nennt den Einkaufspreis, bei dem der Gewinn genau null wird', () => {
    const limit = maxPurchasePrice(usedPhone, 0);

    expect(limit).toBe(236.4); // 150 aktueller Einkauf + 86,40 Gewinn

    const atLimit = calculate({
      ...usedPhone,
      purchase: { amount: limit, vatDeductible: false },
    });
    expect(atLimit.profit.profit).toBe(0);
  });

  it('berücksichtigt einen Zielgewinn', () => {
    const limit = maxPurchasePrice(usedPhone, 40);

    const atLimit = calculate({
      ...usedPhone,
      purchase: { amount: limit, vatDeductible: false },
    });
    expect(atLimit.profit.profit).toBe(40);
  });

  it('rechnet bei abziehbarer Vorsteuer auf einen höheren Bruttopreis hoch', () => {
    const limit = maxPurchasePrice(
      { ...usedPhone, purchase: { amount: 150, vatDeductible: true } },
      0,
    );

    expect(limit).toBeGreaterThan(236.4);
  });

  it('gibt 0 zurück, wenn der Verkauf schon ohne Einkauf defizitär ist', () => {
    const hopeless = maxPurchasePrice({ ...usedPhone, itemPrice: 1, buyerShipping: 0 }, 0);

    expect(hopeless).toBe(0);
  });
});

describe('breakEvenSellPrice', () => {
  it('findet den Verkaufspreis, ab dem der Verkauf kostendeckend ist', () => {
    const price = breakEvenSellPrice(usedPhone);

    const atBreakEven = calculate({ ...usedPhone, itemPrice: price });
    expect(Math.abs(atBreakEven.profit.profit)).toBeLessThanOrEqual(0.01);
  });

  it('gibt 0 zurück, wenn bereits ohne Erlös kein Verlust entsteht', () => {
    const free = breakEvenSellPrice({
      ...usedPhone,
      purchase: { amount: 0, vatDeductible: false },
      shipping: { amount: 0, vatDeductible: false },
    });

    expect(free).toBe(0);
  });
});

describe('Fehlerfälle', () => {
  it('wirft bei unbekannter Kategorie', () => {
    expect(() => calculate({ ...usedPhone, categoryId: 'gibt-es-nicht' })).toThrow(
      UnknownCategoryError,
    );
  });
});

describe('Kaufland', () => {
  const kauflandSale: FeeCalculationInput = {
    marketplaceId: 'kaufland',
    condition: 'used',
    categoryId: 'computer-elektronik-zubehoer',
    itemPrice: 300,
    buyerShipping: 5,
    purchase: { amount: 150, vatDeductible: false },
    shipping: { amount: 5, vatDeductible: true },
  };

  it('erhebt keine Gebühr pro Bestellung', () => {
    const { fees } = calculate(kauflandSale);

    expect(fees.fixedFeeNet).toBe(0);
  });

  it('gewährt keinen reduzierten Satz für gebrauchte Ware', () => {
    const used = calculate(kauflandSale);
    const brandNew = calculate({ ...kauflandSale, condition: 'new' });

    expect(used.fees.commissionPercent).toBe(13);
    expect(used.fees.commissionBasis).toBe('standard');
    expect(used.fees.commissionNet).toBe(brandNew.fees.commissionNet);
  });

  it('rechnet die Provision auf den Betrag inklusive Versand', () => {
    const { fees } = calculate(kauflandSale);

    expect(fees.grossTransactionAmount).toBe(305);
    expect(fees.commissionNet).toBe(39.65); // 305 * 13 %
  });

  it('berechnet in der Medien-Kategorie zusätzlich 0,70 EUR je Artikel', () => {
    const { fees } = calculate({ ...kauflandSale, categoryId: 'medien' });

    expect(fees.fixedFeeNet).toBe(0.7);
  });

  it('legt die monatliche Grundgebühr anteilig auf den Verkauf um', () => {
    const { fees } = calculate({
      ...kauflandSale,
      monthlyFee: { amountNet: 39.95, ordersPerMonth: 50 },
    });

    expect(fees.monthlyFeeShareNet).toBe(0.8); // 39,95 / 50
    expect(fees.totalFeeNet).toBe(40.45);
  });

  it('ignoriert die Grundgebühr ohne erwartete Bestellungen', () => {
    const { fees } = calculate({
      ...kauflandSale,
      monthlyFee: { amountNet: 39.95, ordersPerMonth: 0 },
    });

    expect(fees.monthlyFeeShareNet).toBe(0);
  });

  it('senkt den Gewinn gegenüber demselben Verkauf bei eBay', () => {
    // 13 % ohne Zustandsrabatt gegen 5 % für Gebrauchtware bei eBay.
    const kaufland = calculate(kauflandSale).profit.profit;
    const ebay = calculate({ ...kauflandSale, marketplaceId: 'ebay', categoryId: 'handys-kommunikation' }).profit.profit;

    expect(kaufland).toBeLessThan(ebay);
  });
});

describe('Marktplatz-Fehlerfälle', () => {
  it('wirft bei einer Kategorie, die es auf dem Marktplatz nicht gibt', () => {
    expect(() =>
      calculate({ ...usedPhone, marketplaceId: 'kaufland', categoryId: 'handys-kommunikation' }),
    ).toThrow(UnknownCategoryError);
  });
});

describe('Shop-Abo', () => {
  const schmuck: FeeCalculationInput = {
    ...usedPhone,
    categoryId: 'uhren-schmuck',
    condition: 'new',
    itemPrice: 1000,
    buyerShipping: 0,
  };

  it('staffelt ohne Shop erst ab 990 EUR', () => {
    const { fees } = calculate(schmuck);

    // 990 * 16 % + 10 * 3 %
    expect(fees.commissionNet).toBe(158.7);
  });

  it('staffelt mit Shop bereits ab 500 EUR', () => {
    const { fees } = calculate({ ...schmuck, hasShopSubscription: true });

    // 500 * 16 % + 500 * 3 %
    expect(fees.commissionNet).toBe(95);
  });

  it('ist bei Uhren & Schmuck mit Shop günstiger', () => {
    const ohne = calculate(schmuck).fees.commissionNet;
    const mit = calculate({ ...schmuck, hasShopSubscription: true }).fees.commissionNet;

    expect(mit).toBeLessThan(ohne);
  });

  it('ändert in Kategorien ohne eigene Shop-Staffel nichts', () => {
    const ohne = calculate({ ...usedPhone, categoryId: 'kleidung-accessoires', itemPrice: 1500 });
    const mit = calculate({
      ...usedPhone,
      categoryId: 'kleidung-accessoires',
      itemPrice: 1500,
      hasShopSubscription: true,
    });

    expect(mit.fees.commissionNet).toBe(ohne.fees.commissionNet);
  });
});

describe('Nicht reformierte Kategorien', () => {
  it('staffelt Medien- und Sammelkategorien ab 990 EUR', () => {
    for (const categoryId of ['buecher', 'filme-serien', 'musik', 'games', 'sammeln-seltenes']) {
      const { fees } = calculate({
        ...usedPhone,
        categoryId,
        condition: 'new',
        itemPrice: 1990,
        buyerShipping: 0,
      });

      // 990 * 12 % + 1000 * 3 %
      expect(fees.commissionNet).toBe(148.8);
      expect(fees.commissionBasis).toBe('tiered');
    }
  });

  it('rechnet Spielzeug und Beauty flach mit 14 %', () => {
    for (const categoryId of ['spielzeug', 'beauty-gesundheit']) {
      const { fees } = calculate({
        ...usedPhone,
        categoryId,
        condition: 'new',
        itemPrice: 2000,
        buyerShipping: 0,
      });

      expect(fees.commissionPercent).toBe(14);
      expect(fees.commissionBasis).toBe('standard');
    }
  });
});
