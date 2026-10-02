import { describe, expect, it } from 'vitest';
import { istBelastbar, satzAus, weichtAb, werteMeldungenAus } from './aggregate';
import type { Meldung } from './parse';

const meldung = (teil: Partial<Meldung>): Meldung => ({ version: 1, marktplatz: 'ebay', ...teil });

describe('satzAus', () => {
  it('nimmt den ausdrücklich genannten Prozentsatz', () => {
    expect(satzAus(meldung({ satzTatsaechlich: 12 }))).toBe(12);
  });

  it('rechnet ihn sonst aus Provision und Grundlage aus', () => {
    // Viele tippen lieber die beiden Beträge ab, als selbst zu dividieren.
    // Webcam: 18,48 € von 153,99 € sind 12 %.
    expect(satzAus(meldung({ provisionTatsaechlich: 18.48, grundlage: 153.99 }))).toBe(12);
  });

  it('rundet auf zwei Stellen, damit Rundung in der Abrechnung keine eigenen Sätze erzeugt', () => {
    expect(satzAus(meldung({ provisionTatsaechlich: 5.93, grundlage: 84.75 }))).toBe(7);
  });

  it('gibt nichts zurück, wenn beides fehlt oder unbrauchbar ist', () => {
    expect(satzAus(meldung({}))).toBeUndefined();
    expect(satzAus(meldung({ satzTatsaechlich: 0 }))).toBeUndefined();
    expect(satzAus(meldung({ provisionTatsaechlich: 5, grundlage: 0 }))).toBeUndefined();
  });
});

describe('werteMeldungenAus', () => {
  it('zählt übereinstimmende Meldungen zu einem Befund zusammen', () => {
    const befunde = werteMeldungenAus([
      meldung({ kategorieGewaehlt: 'tv-video-audio', satzTatsaechlich: 12, produkt: 'Fire TV Stick' }),
      meldung({ kategorieGewaehlt: 'tv-video-audio', satzTatsaechlich: 12 }),
      meldung({ kategorieGewaehlt: 'tv-video-audio', satzTatsaechlich: 12 }),
    ]);

    expect(befunde).toHaveLength(1);
    expect(befunde[0]).toMatchObject({
      gruppe: 'tv-video-audio',
      meldungen: 3,
      satz: 12,
      einig: 3,
      einigkeit: 1,
      beispiel: 'Fire TV Stick',
    });
  });

  it('macht Uneinigkeit sichtbar, statt sie zu mitteln', () => {
    /*
      Ein Mittelwert aus 7 und 12 wäre 9,5 — ein Satz, den es nie gegeben hat
      und mit dem niemand je abgerechnet wurde.
    */
    const befunde = werteMeldungenAus([
      meldung({ kategorieGewaehlt: 'x', satzTatsaechlich: 12 }),
      meldung({ kategorieGewaehlt: 'x', satzTatsaechlich: 12 }),
      meldung({ kategorieGewaehlt: 'x', satzTatsaechlich: 7 }),
    ]);

    expect(befunde[0].satz).toBe(12);
    expect(befunde[0].einigkeit).toBeCloseTo(2 / 3, 2);
    expect(befunde[0].verteilung).toEqual([
      { satz: 12, anzahl: 2 },
      { satz: 7, anzahl: 1 },
    ]);
  });

  it('trennt Marktplätze, auch bei gleicher Kategorie-Kennung', () => {
    const befunde = werteMeldungenAus([
      meldung({ marktplatz: 'ebay', kategorieGewaehlt: 'spielzeug', satzTatsaechlich: 12 }),
      meldung({ marktplatz: 'kaufland', kategorieGewaehlt: 'spielzeug', satzTatsaechlich: 8 }),
    ]);

    expect(befunde).toHaveLength(2);
    expect(befunde.map((b) => b.marktplatz).sort()).toEqual(['ebay', 'kaufland']);
  });

  it('kann nach Unterkategorie und nach EAN gruppieren', () => {
    const daten = [
      meldung({ kategorieAngebot: 'TV › Streaming', ean: '5099206113503', satzTatsaechlich: 12 }),
      meldung({ kategorieAngebot: 'TV › Streaming', ean: '5099206113503', satzTatsaechlich: 12 }),
    ];

    expect(werteMeldungenAus(daten, 'unterkategorie')[0].gruppe).toBe('TV › Streaming');
    expect(werteMeldungenAus(daten, 'ean')[0].gruppe).toBe('5099206113503');
  });

  it('übergeht Meldungen ohne verwertbaren Satz oder ohne Gruppe', () => {
    const befunde = werteMeldungenAus([
      meldung({ kategorieGewaehlt: 'x', satzTatsaechlich: 12 }),
      meldung({ kategorieGewaehlt: 'x' }),
      meldung({ satzTatsaechlich: 9 }),
    ]);

    expect(befunde).toHaveLength(1);
    expect(befunde[0].meldungen).toBe(1);
  });

  it('stellt den am besten belegten Befund nach vorn', () => {
    const befunde = werteMeldungenAus([
      meldung({ kategorieGewaehlt: 'schwach', satzTatsaechlich: 12 }),
      meldung({ kategorieGewaehlt: 'stark', satzTatsaechlich: 13 }),
      meldung({ kategorieGewaehlt: 'stark', satzTatsaechlich: 13 }),
      meldung({ kategorieGewaehlt: 'stark', satzTatsaechlich: 13 }),
    ]);

    expect(befunde[0].gruppe).toBe('stark');
  });
});

describe('istBelastbar', () => {
  const befund = (einig: number, gesamt: number) =>
    werteMeldungenAus([
      ...Array.from({ length: einig }, () => meldung({ kategorieGewaehlt: 'x', satzTatsaechlich: 12 })),
      ...Array.from({ length: gesamt - einig }, () => meldung({ kategorieGewaehlt: 'x', satzTatsaechlich: 7 })),
    ])[0];

  it('lässt eine einzelne Meldung nicht genügen', () => {
    expect(istBelastbar(befund(1, 1))).toBe(false);
  });

  it('nimmt zwei übereinstimmende an', () => {
    expect(istBelastbar(befund(2, 2))).toBe(true);
  });

  it('verwirft einen Gleichstand — das ist ein Widerspruch, kein Befund', () => {
    expect(istBelastbar(befund(2, 4))).toBe(false);
  });

  it('nimmt eine klare Mehrheit an', () => {
    expect(istBelastbar(befund(3, 4))).toBe(true);
  });
});

describe('weichtAb', () => {
  it('erkennt eine echte Abweichung vom hinterlegten Satz', () => {
    const [b] = werteMeldungenAus([meldung({ kategorieGewaehlt: 'x', satzTatsaechlich: 12 })]);
    expect(weichtAb(b, 7)).toBe(true);
    expect(weichtAb(b, 12)).toBe(false);
  });

  it('wertet Rundungsunterschiede nicht als Abweichung', () => {
    // 12,01 % statt 12 % entsteht durch Rundung in der Abrechnung.
    const [b] = werteMeldungenAus([meldung({ kategorieGewaehlt: 'x', satzTatsaechlich: 12.01 })]);
    expect(weichtAb(b, 12)).toBe(false);
  });
});
