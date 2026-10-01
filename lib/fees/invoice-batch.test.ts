import { describe, expect, it } from 'vitest';
import { calculate } from './calculate';
import { EBAY } from './ebay';
import type { FeeCalculationInput } from './types';

/*
  Abgeleitet aus 497 Bestellungen echter eBay-Abrechnungen (Konten lr-home und
  lr-supply, Februar bis August 2026). Anders als die vier Einzelbelege in
  `real-invoices.test.ts` deckt dieser Satz die Breite ab: Jede Zeile steht für
  eine Kategorie, deren Satz damit nicht mehr aus Sekundärquellen stammt.

  Angegeben sind Transaktionsbetrag und die variable Verkaufsprovision netto,
  genau so, wie sie auf der Abrechnung stehen. Käufernamen und Bestellnummern
  bleiben draußen, sie tragen zur Prüfung nichts bei.
*/

const BASIS: Omit<FeeCalculationInput, 'itemPrice' | 'categoryId'> = {
  marketplaceId: 'ebay',
  buyerShipping: 0,
  condition: 'new',
  taxScheme: 'standard',
  purchase: { amount: 0, vatDeductible: true },
  shipping: { amount: 0, vatDeductible: true },
};

function provision(categoryId: string, itemPrice: number) {
  return calculate({ ...BASIS, categoryId, itemPrice }).fees.commissionNet;
}

describe('Kategoriesätze gegen echte Abrechnungen (Juli/August 2026)', () => {
  it.each([
    // [Kategorie, Betrag, Provision laut Abrechnung, Beispielartikel]
    ['beauty-gesundheit', 385.98, 46.32, 'Gesichtspflege, 24.07.2026'],
    ['beauty-gesundheit', 44.99, 5.4, 'Reizstromgerät, 08.07.2026'],
    ['beauty-gesundheit', 10.49, 1.26, 'Parfum, 30.08.2026'],
    ['sammeln-seltenes', 815.89, 89.75, 'Sammelkarten-Box, 11.08.2026'],
    ['sammeln-seltenes', 739.99, 81.4, 'Sammelkarten-Box, 22.08.2026'],
    ['streaming-geraete', 23.4, 2.81, 'Streaming-Stick, 09.07.2026'],
    ['streaming-geraete', 57.49, 6.9, 'Streaming-Stick, 10.07.2026'],
    ['tv-video-audio', 84.75, 5.93, 'Smarter Lautsprecher, 05.07.2026'],
    ['computer-tablets-netzwerk', 379.75, 26.58, 'Prozessor, 04.07.2026'],
    ['tastaturen-maeuse', 58.99, 7.08, 'Gaming-Maus, 22.07.2026'],
    ['heimwerker', 123.99, 16.12, 'Hochdruckreiniger, 12.07.2026'],
    ['moebel-wohnen', 79.98, 11.2, 'Deckenleuchte, 10.08.2026'],
    ['moebel-wohnen', 265.98, 37.24, 'Deckenleuchte, 23.08.2026'],
  ])('%s: %s € ergibt %s € Provision (%s)', (categoryId, betrag, erwartet) => {
    expect(provision(categoryId as string, betrag as number)).toBeCloseTo(erwartet as number, 2);
  });

  it('rechnet Streaming-Sticks anders ab als Geräte derselben Hauptkategorie', () => {
    /*
      Die Falle, wegen der es die eigene Kategorie gibt: Beide erscheinen auf
      der Abrechnung unter „TV, Video & Audio". Wer den Stick dort einordnet,
      rechnet mit 7 % statt 12 % und verschätzt sich um 2,85 €.
    */
    const alsGeraet = provision('tv-video-audio', 57.49);
    const alsStick = provision('streaming-geraete', 57.49);
    expect(alsGeraet).toBeCloseTo(4.02, 2);
    expect(alsStick).toBeCloseTo(6.9, 2);
    expect(alsStick - alsGeraet).toBeCloseTo(2.88, 2);
  });
});

describe('Feste Verkaufsgebühr', () => {
  it('nimmt 0,45 € schon bei 10,49 € Bestellwert', () => {
    // Kleinster Verkauf im gesamten Datensatz, direkt über der Schwelle —
    // er belegt, dass die Grenze bei „über 10 €" liegt und nicht bei „ab 10 €".
    expect(EBAY.orderFeeFor(10.49)).toBe(0.45);
    expect(calculate({ ...BASIS, categoryId: 'beauty-gesundheit', itemPrice: 10.49 }).fees
      .fixedFeeNet).toBe(0.45);
  });
});

describe('Zuschlag bei Servicestatus „Unterdurchschnittlich"', () => {
  it('schlägt 6 % des Transaktionsbetrags auf, zusätzlich zur Provision', () => {
    // Kaffeemühle, 21.02.2026: 23,99 € → 1,56 € Provision + 1,44 € Zuschlag.
    const mit = calculate({
      ...BASIS,
      categoryId: 'haushaltsgeraete',
      itemPrice: 23.99,
      belowStandardService: true,
    }).fees;
    expect(mit.serviceSurchargeNet).toBeCloseTo(1.44, 2);
  });

  it('folgt keiner Staffel, auch wenn die Provision eine hat', () => {
    /*
      Lautsprecher, 28.02.2026: 638,49 € → Provision 36,65 € (gestaffelt,
      daher nur 5,74 %), Zuschlag aber volle 6,00 % = 38,31 €. Der Zuschlag
      kennt die Staffel also nicht.
    */
    const fees = calculate({
      ...BASIS,
      categoryId: 'tv-video-audio',
      itemPrice: 638.49,
      belowStandardService: true,
    }).fees;
    expect(fees.serviceSurchargeNet).toBeCloseTo(38.31, 2);
  });

  it('fällt ohne die Angabe gar nicht an', () => {
    const fees = calculate({ ...BASIS, categoryId: 'haushaltsgeraete', itemPrice: 23.99 }).fees;
    expect(fees.serviceSurchargeNet).toBe(0);
  });

  it('erhöht die Gesamtgebühr um genau den Zuschlag', () => {
    const ohne = calculate({ ...BASIS, categoryId: 'haushaltsgeraete', itemPrice: 100 }).fees;
    const mit = calculate({
      ...BASIS,
      categoryId: 'haushaltsgeraete',
      itemPrice: 100,
      belowStandardService: true,
    }).fees;
    expect(mit.totalFeeNet - ohne.totalFeeNet).toBeCloseTo(6, 2);
  });
});
