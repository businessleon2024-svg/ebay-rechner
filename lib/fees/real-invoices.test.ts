import { describe, expect, it } from 'vitest';
import { calculate } from './calculate';
import type { FeeCalculationInput } from './types';

/**
 * Abgleich mit echten eBay-Abrechnungen.
 *
 * Diese Fälle stammen aus tatsächlichen Transaktionen des Verkäuferkontos,
 * nicht aus Gebührenübersichten. Sie sind damit die belastbarste Prüfung, die
 * es für den Rechner gibt: Weicht eine Zahl ab, liegt der Fehler bei uns.
 *
 * Geprüft wird jeweils bis zur Auszahlung, weil eBay genau diesen Betrag
 * ausweist und er alle Zwischenschritte einschließt.
 */

const verkauf = (overrides: Partial<FeeCalculationInput>): FeeCalculationInput => ({
  marketplaceId: 'ebay',
  taxScheme: 'standard',
  categoryId: 'handys-kommunikation',
  condition: 'new',
  itemPrice: 0,
  buyerShipping: 0,
  purchase: { amount: 0, vatDeductible: false },
  shipping: { amount: 0, vatDeductible: false },
  ...overrides,
});

describe('Bestellung 27-15167-92244 · Crucial 32GB DDR5 · 22.09.2026', () => {
  // Artikelpreis 411,99 €, kein Käufer-Versand.
  // Kategorie Computer, Tablets & Netzwerk, 7 %.
  const { fees } = calculate(
    verkauf({ categoryId: 'computer-tablets-netzwerk', itemPrice: 411.99 }),
  );

  it('trifft die Gebührengrundlage', () => {
    expect(fees.grossTransactionAmount).toBe(411.99);
  });

  it('trifft die Verkaufsprovision von 28,84 €', () => {
    expect(fees.commissionPercent).toBe(7);
    expect(fees.commissionNet).toBe(28.84);
  });

  it('trifft die feste Verkaufsgebühr von 0,45 €', () => {
    expect(fees.fixedFeeNet).toBe(0.45);
  });

  it('trifft Gesamtgebühren, Umsatzsteuer und Auszahlung', () => {
    expect(fees.totalFeeNet).toBe(29.29);
    expect(fees.feeVat).toBe(5.57);
    expect(fees.totalFeeGross).toBe(34.86);
    expect(fees.payout).toBe(377.13);
  });
});

describe('Bestellung 01-15232-43152 · Bose QuietComfort Ultra · 25.09.2026', () => {
  // Artikelpreis 217,00 € plus 20,00 € Käufer-Versand = 237,00 € Grundlage.
  // Kategorie TV, Video & Audio, 7 %. Lieferung nach Österreich, internationale
  // Gebühr laut Abrechnung 0,00 €.
  const { fees } = calculate(
    verkauf({ categoryId: 'tv-video-audio', itemPrice: 217, buyerShipping: 20 }),
  );

  it('bezieht den Käufer-Versand in die Gebührengrundlage ein', () => {
    expect(fees.grossTransactionAmount).toBe(237);
  });

  it('trifft die Verkaufsprovision von 16,59 €', () => {
    expect(fees.commissionPercent).toBe(7);
    expect(fees.commissionNet).toBe(16.59);
  });

  it('trifft Gesamtgebühren, Umsatzsteuer und Auszahlung', () => {
    expect(fees.totalFeeNet).toBe(17.04);
    expect(fees.feeVat).toBe(3.24);
    expect(fees.totalFeeGross).toBe(20.28);
    expect(fees.payout).toBe(216.72);
  });
});

describe('Bestellung 11-15218-13403 · Tonie Pumuckl · 27.09.2026', () => {
  // Artikelpreis 26,99 € plus Versand = 32,98 € Grundlage.
  // Kategorie Spielzeug. Die Abrechnung weist 12,0 % aus, gestaffelt mit dem
  // Zusatz "Tarif für 0,00 € – 990,00 €".
  const { fees } = calculate(verkauf({ categoryId: 'spielzeug', itemPrice: 32.98 }));

  it('trifft die Verkaufsprovision von 3,96 € bei 12 %', () => {
    expect(fees.commissionPercent).toBe(12);
    expect(fees.commissionNet).toBe(3.96);
  });

  it('trifft Gesamtgebühren, Umsatzsteuer und Auszahlung', () => {
    expect(fees.totalFeeNet).toBe(4.41);
    expect(fees.feeVat).toBe(0.84);
    expect(fees.totalFeeGross).toBe(5.25);
    expect(fees.payout).toBe(27.73);
  });
});

describe('Feste Verkaufsgebühr laut Abrechnung', () => {
  // Alle drei Abrechnungen nennen die Staffel als "Gesamtbetrag 10,01 €+",
  // was die Schwelle bestätigt: 0,45 € erst oberhalb von 10,00 €.
  it('beträgt bei 10,00 € noch 0,35 €', () => {
    expect(calculate(verkauf({ itemPrice: 10 })).fees.fixedFeeNet).toBe(0.35);
  });

  it('beträgt ab 10,01 € dann 0,45 €', () => {
    expect(calculate(verkauf({ itemPrice: 10.01 })).fees.fixedFeeNet).toBe(0.45);
  });
});

describe('Logitech MX Brio Webcam · 12 % trotz Kategorie "Computer, Tablets & Netzwerk"', () => {
  /*
    Diese Abrechnung belegt das Unterkategorie-Problem erstmals unmittelbar:
    eBay weist dieselbe Kategoriebezeichnung aus wie beim Arbeitsspeicher
    (7 %), rechnet hier aber mit 12 %. Maßgeblich ist offensichtlich die
    Unterkategorie — Zubehör statt Gerät —, und die veröffentlicht eBay nicht.

    Im Rechner ist dieser Fall über eine der Zubehör-Kategorien abzubilden.
    Artikelpreis 148,00 € plus Versand ergibt 153,99 € Gebührengrundlage.
  */
  const { fees } = calculate(
    verkauf({ categoryId: 'notebook-desktop-zubehoer', itemPrice: 153.99 }),
  );

  it('trifft die Verkaufsprovision von 18,48 € bei 12 %', () => {
    expect(fees.commissionPercent).toBe(12);
    expect(fees.commissionNet).toBe(18.48);
  });

  it('trifft Gesamtgebühren, Umsatzsteuer und Auszahlung', () => {
    expect(fees.totalFeeNet).toBe(18.93);
    expect(fees.feeVat).toBe(3.6);
    expect(fees.totalFeeGross).toBe(22.53);
    expect(fees.payout).toBe(131.46);
  });

  it('läge über die Geräte-Kategorie deutlich zu niedrig', () => {
    // Was passiert wäre, hätte man nach der Bezeichnung auf der Abrechnung
    // die 7-%-Kategorie gewählt.
    const zuNiedrig = calculate(
      verkauf({ categoryId: 'computer-tablets-netzwerk', itemPrice: 153.99 }),
    ).fees;

    expect(zuNiedrig.commissionNet).toBe(10.78);
    expect(fees.commissionNet - zuNiedrig.commissionNet).toBeCloseTo(7.7, 2);
  });
});
