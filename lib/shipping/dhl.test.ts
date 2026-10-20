import { describe, expect, it } from 'vitest';
import {
  ENERGIE_ANTEIL,
  GEWICHTSSTUFEN,
  MAUT_ZUSCHLAG,
  basispreisFuer,
  istUebergross,
  stufeFuer,
  versandkosten,
} from './dhl';

describe('stufeFuer', () => {
  it('ordnet jedes Gewicht der richtigen Stufe zu', () => {
    expect(stufeFuer(0.4)?.id).toBe('bis-1');
    expect(stufeFuer(2)?.id).toBe('bis-3');
    expect(stufeFuer(4.2)?.id).toBe('bis-5');
    expect(stufeFuer(9)?.id).toBe('bis-10');
    expect(stufeFuer(18)?.id).toBe('bis-20');
    expect(stufeFuer(30)?.id).toBe('bis-31-5');
  });

  /*
    Die Grenze gehört zur Stufe, nicht zur nächsten. Ein Paket von genau
    1,00 kg kostet die 1-kg-Stufe — so steht es auch auf den Rechnungen.
  */
  it('zählt das Grenzgewicht noch zur kleineren Stufe', () => {
    expect(stufeFuer(1)?.id).toBe('bis-1');
    expect(stufeFuer(1.01)?.id).toBe('bis-3');
    expect(stufeFuer(31.5)?.id).toBe('bis-31-5');
  });

  it('gibt null über 31,5 kg und bei 0 zurück', () => {
    expect(stufeFuer(31.6)).toBeNull();
    expect(stufeFuer(0)).toBeNull();
    expect(stufeFuer(-1)).toBeNull();
  });
});

describe('Preise gegen die Rechnungen', () => {
  /*
    Die sechs Grundpreise, wie sie seit Januar 2026 auf den Rechnungen
    stehen. Ändert jemand einen Wert in der Tabelle, ohne eine neue
    Abrechnung zu haben, fällt es hier auf.
  */
  it.each([
    ['bis-1', 5.0],
    ['bis-3', 5.55],
    ['bis-5', 6.6],
    ['bis-10', 8.65],
    ['bis-20', 13.55],
    ['bis-31-5', 16.3],
  ])('%s kostet %s € netto', (id, erwartet) => {
    expect(GEWICHTSSTUFEN.find((s) => s.id === id)?.basispreis).toBe(erwartet);
  });

  /*
    Der Energiezuschlag steht auf den Rechnungen als 1,25 % ausgewiesen. Hier
    gegen die tatsächlich abgerechneten Centbeträge gehalten — alle sechs
    Stufen müssen auf den Cent stimmen, sonst ist entweder der Satz oder die
    Rundung falsch.
  */
  it.each([
    [5.0, 0.06],
    [5.55, 0.07],
    [6.6, 0.08],
    [8.65, 0.11],
    [13.55, 0.17],
    [16.3, 0.2],
  ])('Energiezuschlag auf %s € ergibt %s €', (basis, erwartet) => {
    expect(Math.round(basis * ENERGIE_ANTEIL * 100) / 100).toBe(erwartet);
  });

  it('der Maut- und CO2-Zuschlag ist ein fester Betrag', () => {
    expect(MAUT_ZUSCHLAG).toBe(0.19);
  });
});

describe('versandkosten', () => {
  it('summiert Grundpreis und beide Zuschläge', () => {
    const k = versandkosten(0.8);

    expect(k?.basispreis).toBe(5.0);
    expect(k?.mautZuschlag).toBe(0.19);
    expect(k?.energieZuschlag).toBe(0.06);
    expect(k?.gesamt).toBe(5.25);
  });

  it('rechnet die schwerste Stufe korrekt', () => {
    const k = versandkosten(25);

    expect(k?.stufe.id).toBe('bis-31-5');
    expect(k?.gesamt).toBe(16.69); // 16,30 + 0,19 + 0,20
  });

  it('gibt null über 31,5 kg zurück', () => {
    expect(versandkosten(35)).toBeNull();
  });

  /*
    Der Energiezuschlag ist prozentual. Wer einen eigenen Grundpreis
    hinterlegt, muss ihn auch darauf berechnet bekommen — sonst stünde ein
    Zuschlag auf einem Preis, den dieser Kunde gar nicht zahlt.
  */
  it('rechnet den Energiezuschlag auf dem eigenen Preis', () => {
    const k = versandkosten(0.8, { 'bis-1': 4.0 });

    expect(k?.basispreis).toBe(4.0);
    expect(k?.energieZuschlag).toBe(0.05); // 1,25 % von 4,00
    expect(k?.gesamt).toBe(4.24);
  });

  /*
    0 € ist ein zulässiger eigener Preis, etwa bei Pauschalvertrag. `??`
    statt `||`, sonst fiele die Null auf den hinterlegten Preis zurück.
  */
  it('akzeptiert 0 € als eigenen Grundpreis', () => {
    expect(basispreisFuer(GEWICHTSSTUFEN[0], { 'bis-1': 0 })).toBe(0);
  });
});

describe('istUebergross', () => {
  it('lässt ein Paket innerhalb der Maße durch', () => {
    expect(istUebergross({ laenge: 100, breite: 50, hoehe: 40 })).toBe(false);
  });

  it('meldet eine zu lange Kante', () => {
    expect(istUebergross({ laenge: 130, breite: 30, hoehe: 20 })).toBe(true);
  });

  it('lässt die Grenzmaße selbst noch zu', () => {
    expect(istUebergross({ laenge: 120, breite: 60, hoehe: 60 })).toBe(false);
  });

  /*
    Derselbe Karton, anders eingetippt. Wer die Kanten der Reihe nach
    vergleicht, meldet hier Übergröße, wo keine ist.
  */
  it('darf das Paket drehen', () => {
    expect(istUebergross({ laenge: 20, breite: 60, hoehe: 110 })).toBe(false);
    expect(istUebergross({ laenge: 40, breite: 50, hoehe: 100 })).toBe(false);
  });
});

describe('Stufenliste', () => {
  it('ist aufsteigend nach Gewicht sortiert', () => {
    const gewichte = GEWICHTSSTUFEN.map((s) => s.bisKg);
    expect(gewichte).toEqual([...gewichte].sort((a, b) => a - b));
  });

  it('wird mit dem Gewicht nicht billiger', () => {
    const preise = GEWICHTSSTUFEN.map((s) => s.basispreis);
    expect(preise).toEqual([...preise].sort((a, b) => a - b));
  });

  it('hat eindeutige Kennungen', () => {
    const ids = GEWICHTSSTUFEN.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
