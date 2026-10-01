import { describe, expect, it } from 'vitest';
import { baueKategoriekarte, hinterlegterVorfahr, pfadAlsText } from './taxonomy';

/*
  Der Baum ist der Form nachgebildet, die eBay liefert: eine Wurzel ohne
  eigene Bedeutung, darunter rekursiv `childCategoryTreeNodes`.

  Die Zweige sind die beiden Fälle, an denen sich der Rechner schon verrechnet
  hat: Webcams und Arbeitsspeicher hängen unter derselben Hauptkategorie,
  werden aber verschieden abgerechnet.
*/
const BAUM = {
  rootCategoryNode: {
    category: { categoryId: '0', categoryName: 'Root' },
    childCategoryTreeNodes: [
      {
        category: { categoryId: '58058', categoryName: 'Computer, Tablets & Netzwerk' },
        leafCategoryTreeNode: false,
        childCategoryTreeNodes: [
          {
            category: { categoryId: '175672', categoryName: 'Webcams' },
            leafCategoryTreeNode: true,
          },
          {
            category: { categoryId: '170083', categoryName: 'Arbeitsspeicher (RAM)' },
            leafCategoryTreeNode: true,
          },
        ],
      },
      {
        category: { categoryId: '293', categoryName: 'TV, Video & Audio' },
        leafCategoryTreeNode: false,
        childCategoryTreeNodes: [
          {
            category: { categoryId: '182094', categoryName: 'Medien-Streaming-Geräte' },
            leafCategoryTreeNode: true,
          },
        ],
      },
    ],
  },
};

describe('baueKategoriekarte', () => {
  const karte = baueKategoriekarte(BAUM);

  it('erfasst Blätter mit ihrem vollständigen Pfad', () => {
    expect(karte.get('175672')).toEqual({
      namen: ['Computer, Tablets & Netzwerk', 'Webcams'],
      nummern: ['58058', '175672'],
    });
  });

  it('erfasst auch Zwischenknoten, nicht nur Blätter', () => {
    // Die Abrechnung nennt oft die Hauptkategorie — die muss auflösbar sein.
    expect(karte.get('58058')).toEqual({
      namen: ['Computer, Tablets & Netzwerk'],
      nummern: ['58058'],
    });
  });

  it('lässt die Wurzel weg, sie ist keine echte Kategorie', () => {
    expect(karte.has('0')).toBe(false);
    expect(karte.get('293')?.namen).toEqual(['TV, Video & Audio']);
  });

  it('trennt Zweige unter derselben Hauptkategorie sauber', () => {
    expect(pfadAlsText(karte.get('175672'))).toBe('Computer, Tablets & Netzwerk › Webcams');
    expect(pfadAlsText(karte.get('170083'))).toBe(
      'Computer, Tablets & Netzwerk › Arbeitsspeicher (RAM)',
    );
  });

  it('kommt mit einer unerwarteten oder leeren Antwort zurecht', () => {
    for (const eingabe of [null, undefined, {}, 'kaputt', { rootCategoryNode: null }]) {
      expect(baueKategoriekarte(eingabe).size).toBe(0);
    }
  });

  it('übergeht Knoten ohne Nummer, statt zu stolpern', () => {
    const karte = baueKategoriekarte({
      rootCategoryNode: {
        childCategoryTreeNodes: [
          { category: { categoryName: 'Ohne Nummer' } },
          { category: { categoryId: '42', categoryName: 'Mit Nummer' } },
        ],
      },
    });
    expect([...karte.keys()]).toEqual(['42']);
  });
});

describe('hinterlegterVorfahr', () => {
  const karte = baueKategoriekarte(BAUM);
  const bekannt = new Set(['58058', '293']);

  it('findet die Hauptkategorie zu einem unbekannten Blatt', () => {
    // Genau der Webcam-Fall: Das Blatt kennt der Rechner nicht, die
    // Hauptkategorie darüber schon.
    expect(hinterlegterVorfahr(karte.get('175672'), bekannt)).toBe('58058');
  });

  it('nimmt die oberste hinterlegte Ebene, nicht die unterste', () => {
    // Hinterlegt sind Hauptkategorien. Wären beide Ebenen bekannt, zählt die
    // obere — unter ihr führt die Abrechnung den Verkauf.
    const beide = new Set(['58058', '175672']);
    expect(hinterlegterVorfahr(karte.get('175672'), beide)).toBe('58058');
  });

  it('gibt nichts zurück, wenn keine Ebene hinterlegt ist', () => {
    expect(hinterlegterVorfahr(karte.get('175672'), new Set(['999']))).toBeUndefined();
    expect(hinterlegterVorfahr(undefined, bekannt)).toBeUndefined();
  });
});

describe('pfadAlsText', () => {
  it('gibt nichts zurück, wenn kein Pfad vorliegt', () => {
    expect(pfadAlsText(undefined)).toBeUndefined();
    expect(pfadAlsText({ namen: [], nummern: [] })).toBeUndefined();
  });
});
