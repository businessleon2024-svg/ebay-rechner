import { describe, expect, it } from 'vitest';
import { DHL_PRODUKTE, guenstigstesProdukt, passtIn, preisFuer } from './dhl';

const produkt = (id: string) => {
  const gefunden = DHL_PRODUKTE.find((p) => p.id === id);
  if (!gefunden) throw new Error(`Produkt ${id} fehlt`);
  return gefunden;
};

describe('passtIn', () => {
  it('nimmt ein Paket an, das in alle Maße passt', () => {
    expect(passtIn(produkt('paeckchen-s'), { laenge: 30, breite: 20, hoehe: 8 }, 1)).toBe(true);
  });

  it('lehnt ab, wenn eine Kante zu lang ist', () => {
    expect(passtIn(produkt('paeckchen-s'), { laenge: 40, breite: 20, hoehe: 8 }, 1)).toBe(false);
  });

  it('lehnt ab, wenn das Gewicht nicht reicht', () => {
    expect(passtIn(produkt('paeckchen-s'), { laenge: 30, breite: 20, hoehe: 8 }, 3)).toBe(false);
  });

  /*
    Der Fehler, der solchen Rechnern am häufigsten unterläuft: Kanten der
    Reihe nach vergleichen. Ein Karton von 8 × 20 × 30 cm ist derselbe wie
    30 × 20 × 8 — man darf ihn drehen. Wer stur Länge gegen Länge prüft,
    lehnt Pakete ab, die tatsächlich passen.
  */
  it('darf das Paket drehen', () => {
    const quer = { laenge: 8, breite: 20, hoehe: 30 };
    const laengs = { laenge: 30, breite: 20, hoehe: 8 };

    expect(passtIn(produkt('paeckchen-s'), quer, 1)).toBe(
      passtIn(produkt('paeckchen-s'), laengs, 1),
    );
    expect(passtIn(produkt('paeckchen-s'), quer, 1)).toBe(true);
  });

  it('lässt die Grenzmaße selbst noch zu', () => {
    expect(passtIn(produkt('paeckchen-s'), { laenge: 35, breite: 25, hoehe: 10 }, 2)).toBe(true);
  });

  it('lehnt einen Millimeter darüber ab', () => {
    expect(passtIn(produkt('paeckchen-s'), { laenge: 35.1, breite: 25, hoehe: 10 }, 2)).toBe(false);
  });
});

describe('guenstigstesProdukt', () => {
  it('findet das kleinste passende Produkt', () => {
    const p = guenstigstesProdukt({ laenge: 30, breite: 20, hoehe: 8 }, 1);

    expect(p?.id).toBe('paeckchen-s');
  });

  it('steigt auf, wenn das Gewicht nicht mehr reicht', () => {
    const p = guenstigstesProdukt({ laenge: 50, breite: 30, hoehe: 15 }, 4);

    expect(p?.id).toBe('paket-5');
  });

  /*
    `null` heißt „so nicht versendbar", nicht „kostenlos". Die Oberfläche
    muss das als eigenen Fall zeigen; als 0 € gelesen wäre es eine
    Gewinnrechnung ohne Porto.
  */
  it('gibt null zurück, wenn nichts passt', () => {
    expect(guenstigstesProdukt({ laenge: 200, breite: 60, hoehe: 60 }, 5)).toBeNull();
    expect(guenstigstesProdukt({ laenge: 30, breite: 20, hoehe: 10 }, 40)).toBeNull();
  });

  /*
    Mit eigenen Vertragspreisen kann ein größeres Produkt billiger sein. Dann
    muss es gewinnen — sonst wäre „günstigstes" eine Behauptung, die der
    Rechner selbst widerlegt.
  */
  it('folgt den eigenen Preisen, nicht der Größe', () => {
    const eigene = { 'paeckchen-s': 4.5, 'paeckchen-m': 2.0 };
    const p = guenstigstesProdukt({ laenge: 30, breite: 20, hoehe: 8 }, 1, eigene);

    expect(p?.id).toBe('paeckchen-m');
  });

  it('bleibt beim kleineren, wenn beide gleich kosten', () => {
    const eigene = { 'paeckchen-s': 3.0, 'paeckchen-m': 3.0 };
    const p = guenstigstesProdukt({ laenge: 30, breite: 20, hoehe: 8 }, 1, eigene);

    expect(p?.id).toBe('paeckchen-s');
  });
});

describe('preisFuer', () => {
  it('nimmt den Vorgabepreis, wenn kein eigener hinterlegt ist', () => {
    expect(preisFuer(produkt('paeckchen-s'))).toBe(produkt('paeckchen-s').vorgabePreis);
  });

  it('lässt den eigenen Preis gewinnen', () => {
    expect(preisFuer(produkt('paeckchen-s'), { 'paeckchen-s': 2.5 })).toBe(2.5);
  });

  /*
    0 € ist ein zulässiger eigener Preis — etwa bei Abholung oder
    Pauschalvertrag. `??` statt `||`, sonst fiele die 0 auf den Vorgabewert
    zurück und der Rechner berechnete Porto, das nicht anfällt.
  */
  it('akzeptiert 0 € als eigenen Preis', () => {
    expect(preisFuer(produkt('paeckchen-s'), { 'paeckchen-s': 0 })).toBe(0);
  });
});

describe('Produktliste', () => {
  it('ist nach Kapazität aufsteigend sortiert', () => {
    const gewichte = DHL_PRODUKTE.map((p) => p.maxGewicht);

    expect(gewichte).toEqual([...gewichte].sort((a, b) => a - b));
  });

  it('hat eindeutige Kennungen', () => {
    const ids = DHL_PRODUKTE.map((p) => p.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
