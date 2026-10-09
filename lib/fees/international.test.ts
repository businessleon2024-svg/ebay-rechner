import { describe, expect, it } from 'vitest';
import { calculate } from './calculate';
import {
  DEFAULT_INTERNATIONAL_REGION,
  INTERNATIONAL_REGIONS,
  internationalRatePercent,
} from './international';
import type { FeeCalculationInput } from './types';

const BASIS: FeeCalculationInput = {
  marketplaceId: 'ebay',
  categoryId: 'handys-kommunikation',
  condition: 'new',
  itemPrice: 100,
  buyerShipping: 0,
  purchase: { amount: 0, vatDeductible: false },
  shipping: { amount: 0, vatDeductible: false },
};

describe('internationalRatePercent', () => {
  it('kennt die hinterlegten Regionen', () => {
    expect(internationalRatePercent('inland')).toBe(0);
    expect(internationalRatePercent('uk')).toBe(1.2);
    expect(internationalRatePercent('us_ca')).toBe(1.6);
    expect(internationalRatePercent('welt')).toBe(3.3);
  });

  /*
    Eine unbekannte Kennung darf keinen Zuschlag erfinden. Sie entsteht, wenn
    ein alter Wert aus dem Speicher des Browsers kommt und die Liste sich
    seitdem geändert hat — dann soll die Gebühr fehlen, nicht geraten werden.
  */
  it('ergibt 0 für Unbekanntes und für nichts', () => {
    expect(internationalRatePercent('mond')).toBe(0);
    expect(internationalRatePercent(undefined)).toBe(0);
    expect(internationalRatePercent('')).toBe(0);
  });

  it('hat die Vorgabe in der Liste und sie kostet nichts', () => {
    const vorgabe = INTERNATIONAL_REGIONS.find((r) => r.id === DEFAULT_INTERNATIONAL_REGION);
    expect(vorgabe).toBeDefined();
    expect(vorgabe?.percent).toBe(0);
  });
});

describe('internationale Gebühr in der Berechnung', () => {
  it('rechnet den Satz auf den Transaktionsbetrag', () => {
    const { fees } = calculate({ ...BASIS, internationalRegion: 'uk' });

    expect(fees.internationalFeeNet).toBe(1.2);
  });

  /*
    Die Grundlage ist der Transaktionsbetrag, also einschließlich des vom
    Käufer gezahlten Versands — wie bei der Provision. Nur den Artikelpreis
    zu nehmen wäre die häufigste Fehlannahme überhaupt.
  */
  it('bezieht den vom Käufer gezahlten Versand mit ein', () => {
    const { fees } = calculate({
      ...BASIS,
      itemPrice: 100,
      buyerShipping: 50,
      internationalRegion: 'welt',
    });

    expect(fees.internationalFeeNet).toBe(4.95); // 3,3 % von 150
  });

  it('kostet im Inland nichts', () => {
    const { fees } = calculate({ ...BASIS, internationalRegion: 'inland' });

    expect(fees.internationalFeeNet).toBe(0);
  });

  it('bleibt ohne Angabe bei null', () => {
    const { fees } = calculate(BASIS);

    expect(fees.internationalFeeNet).toBe(0);
  });

  /*
    Der entscheidende Fall: Wer den Betrag von seiner Abrechnung abtippt und
    die Region stehen lässt, darf ihn nicht doppelt zahlen. Der abgetippte
    Betrag ist der belegte und gewinnt.
  */
  it('lässt einen eingetragenen Betrag gewinnen, statt zu addieren', () => {
    const { fees } = calculate({
      ...BASIS,
      internationalRegion: 'welt',
      internationalFeeNet: 2,
    });

    expect(fees.internationalFeeNet).toBe(2);
  });

  it('erhöht die Gesamtgebühr um genau diesen Betrag', () => {
    const ohne = calculate(BASIS);
    const mit = calculate({ ...BASIS, internationalRegion: 'uk' });

    expect(mit.fees.totalFeeNet - ohne.fees.totalFeeNet).toBeCloseTo(1.2, 2);
  });
});
