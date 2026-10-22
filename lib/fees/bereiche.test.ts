import { describe, expect, it } from 'vitest';
import {
  bereichFuerKategorie,
  bereichVon,
  bereicheVon,
  ersteKategorieIn,
} from './bereiche';
import { EBAY, KAUFLAND, MARKETPLACES } from './marketplaces';

describe('bereichVon', () => {
  it('nimmt die hinterlegte Oberkategorie', () => {
    const tastatur = EBAY.categories.find((k) => k.id === 'tastaturen-maeuse');

    expect(tastatur && bereichVon(tastatur)).toBe('Computer, Tablets & Netzwerk');
  });

  /*
    Zwei Dutzend Einträge haben nur einen Satz und brauchen keine
    Unterauswahl. Sie stehen für sich — ihr eigener Name ist die
    Oberkategorie, und die Oberfläche zeigt dort kein zweites Feld.
  */
  it('lässt einen Eintrag ohne Angabe für sich stehen', () => {
    const sport = EBAY.categories.find((k) => k.id === 'sport');

    expect(sport?.bereich).toBeUndefined();
    expect(sport && bereichVon(sport)).toBe('Sport');
  });
});

describe('bereicheVon', () => {
  it('fasst die Einträge einer Oberkategorie zusammen', () => {
    const computer = bereicheVon(EBAY).find((b) => b.name === 'Computer, Tablets & Netzwerk');

    expect(computer?.kategorien.map((k) => k.id)).toContain('drucker');
    expect(computer?.kategorien.map((k) => k.id)).toContain('tastaturen-maeuse');
  });

  it('verliert keinen einzigen Eintrag', () => {
    for (const marktplatz of MARKETPLACES) {
      const summe = bereicheVon(marktplatz).reduce((n, b) => n + b.kategorien.length, 0);

      expect(summe).toBe(marktplatz.categories.length);
    }
  });

  it('ordnet jeden Eintrag genau einer Oberkategorie zu', () => {
    const gesehen = new Set<string>();
    for (const bereich of bereicheVon(EBAY)) {
      for (const kategorie of bereich.kategorien) {
        expect(gesehen.has(kategorie.id)).toBe(false);
        gesehen.add(kategorie.id);
      }
    }
  });

  it('verkürzt die Liste spürbar', () => {
    expect(bereicheVon(EBAY).length).toBeLessThan(EBAY.categories.length / 1.5);
  });

  /*
    Der eigentliche Zweck. In diesen Oberkategorien liegen verschiedene Sätze
    nebeneinander — genau dort verrechnet man sich, wenn man nur die
    Oberkategorie wählt und die Unterauswahl übergeht.
  */
  it.each([
    ['Computer, Tablets & Netzwerk'],
    ['Foto & Camcorder'],
    ['Handys & Kommunikation'],
    ['TV, Video & Audio'],
    ['PC- & Videospiele'],
    ['Beauty & Gesundheit'],
  ])('%s ist als uneinheitlich erkannt', (name) => {
    const bereich = bereicheVon(EBAY).find((b) => b.name === name);

    expect(bereich?.uneinheitlich).toBe(true);
  });

  it('meldet einen Einzeleintrag nicht als uneinheitlich', () => {
    const sport = bereicheVon(EBAY).find((b) => b.name === 'Sport');

    expect(sport?.kategorien).toHaveLength(1);
    expect(sport?.uneinheitlich).toBe(false);
  });

  it('behält die Reihenfolge der Gebührentabelle bei', () => {
    const bereiche = bereicheVon(EBAY);

    expect(bereiche[0].name).toBe('Computer, Tablets & Netzwerk');
  });

  it('trägt auch einen Marktplatz ohne Oberkategorien', () => {
    const bereiche = bereicheVon(KAUFLAND);

    expect(bereiche.length).toBe(KAUFLAND.categories.length);
    expect(bereiche.every((b) => b.kategorien.length === 1)).toBe(true);
  });
});

describe('bereichFuerKategorie', () => {
  it('findet die Oberkategorie zu einem Eintrag', () => {
    expect(bereichFuerKategorie(EBAY, 'handy-zubehoer')?.name).toBe('Handys & Kommunikation');
  });

  it('findet auch einen Eintrag, der für sich steht', () => {
    expect(bereichFuerKategorie(EBAY, 'spielzeug')?.name).toBe('Spielzeug');
  });

  /*
    Eine unbekannte Kennung entsteht, wenn ein alter Wert aus dem Speicher
    des Browsers kommt und die Tabelle sich seitdem geändert hat. Dann
    `undefined` — die Oberfläche fällt auf ihre Vorgabe zurück, statt eine
    Oberkategorie zu erfinden.
  */
  it('gibt undefined für eine unbekannte Kennung zurück', () => {
    expect(bereichFuerKategorie(EBAY, 'gibt-es-nicht')).toBeUndefined();
  });
});

describe('ersteKategorieIn', () => {
  /*
    Der erste Eintrag, nicht der günstigste: Die Tabelle listet das
    Hauptprodukt zuerst und das Zubehör danach. Wer „Computer" wählt, meint
    in aller Regel einen Rechner, kein Kabel.
  */
  it('nimmt den ersten Eintrag, also das Hauptprodukt', () => {
    const computer = bereicheVon(EBAY).find((b) => b.name === 'Computer, Tablets & Netzwerk');

    expect(computer && ersteKategorieIn(computer).id).toBe('computer-tablets-netzwerk');
  });
});
